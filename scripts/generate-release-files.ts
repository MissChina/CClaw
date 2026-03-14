#!/usr/bin/env -S node --import tsx

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type CliOptions = {
  outputDir: string;
  version: string;
  tag: string;
  repo: string;
  commit: string;
  artifactsDir: string;
};

type ParsedChangelogSection = {
  version: string;
  markdown: string;
  headings: Array<{ title: string; bullets: string[] }>;
};

function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg?.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    values.set(key, value);
    i += 1;
  }

  const outputDir = values.get("output-dir") ?? ".artifacts/release";
  const version = values.get("version") ?? "";
  const tag = values.get("tag") ?? `v${version}`;
  const repo = values.get("repo") ?? "";
  const commit = values.get("commit") ?? "";
  const artifactsDir = values.get("artifacts-dir") ?? ".artifacts/release-assets";

  if (!version.trim()) {
    throw new Error("--version is required");
  }

  return {
    outputDir,
    version: version.trim(),
    tag: tag.trim(),
    repo: repo.trim(),
    commit: commit.trim(),
    artifactsDir,
  };
}

function readPackageVersion(): string {
  const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { version?: string };
  return String(pkg.version ?? "").trim();
}

function extractChangelogSection(version: string): ParsedChangelogSection {
  const changelog = readFileSync(resolve("CHANGELOG.md"), "utf8");
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const versionRegex = new RegExp(`^## ${escapedVersion}\\r?\\n([\\s\\S]*?)(?=^## |\\Z)`, "m");
  const unreleasedRegex = /^## Unreleased\r?\n([\s\S]*?)(?=^## |$)/m;

  const versionMatch = versionRegex.exec(changelog);
  const unreleasedMatch = unreleasedRegex.exec(changelog);
  const match = versionMatch ?? unreleasedMatch;
  if (!match) {
    throw new Error(`Could not find changelog section for ${version} or Unreleased.`);
  }

  const foundVersion = versionMatch ? version : "Unreleased";
  const markdown = match[1].trim();
  const lines = markdown.split(/\r?\n/);
  const headings: Array<{ title: string; bullets: string[] }> = [];
  let current: { title: string; bullets: string[] } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const headingMatch = /^###\s+(.+)$/.exec(line);
    if (headingMatch) {
      current = { title: headingMatch[1].trim(), bullets: [] };
      headings.push(current);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!current) {
        current = { title: "Highlights", bullets: [] };
        headings.push(current);
      }
      current.bullets.push(line.slice(2).trim());
    }
  }

  return {
    version: foundVersion,
    markdown,
    headings,
  };
}

function formatUtcTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sha256File(path: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function listArtifacts(dir: string): Array<{ name: string; size: number; sha256: string }> {
  return readdirSync(dir)
    .map((name) => ({ name, path: join(dir, name) }))
    .filter((entry) => statSync(entry.path).isFile())
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      name: entry.name,
      size: statSync(entry.path).size,
      sha256: sha256File(entry.path),
    }));
}

function toEnglishTitle(title: string): string {
  switch (title.toLowerCase()) {
    case "changes":
      return "Changes";
    case "fixes":
      return "Fixes";
    case "security":
      return "Security";
    case "highlights":
      return "Highlights";
    default:
      return title;
  }
}

function toChineseTitle(title: string): string {
  switch (title.toLowerCase()) {
    case "changes":
      return "变更";
    case "fixes":
      return "修复";
    case "security":
      return "安全更新";
    case "highlights":
      return "重点";
    default:
      return title;
  }
}

function buildEnglishNotes(params: {
  version: string;
  tag: string;
  repo: string;
  commit: string;
  changelog: ParsedChangelogSection;
  artifacts: Array<{ name: string; size: number; sha256: string }>;
  generatedAt: string;
}): string {
  const links: string[] = [];
  if (params.repo) {
    links.push(`Repository: https://github.com/${params.repo}`);
  }
  if (params.repo && params.tag) {
    links.push(`Tag: https://github.com/${params.repo}/releases/tag/${params.tag}`);
  }
  if (params.repo && params.commit) {
    links.push(`Commit: https://github.com/${params.repo}/commit/${params.commit}`);
  }

  const artifactLines = params.artifacts.map(
    (artifact) => `- \`${artifact.name}\` (${artifact.size} bytes, sha256: \`${artifact.sha256}\`)`,
  );

  const changeSections = params.changelog.headings.map((section) => {
    const bullets = section.bullets.map((bullet) => `- ${bullet}`).join("\n");
    return `### ${toEnglishTitle(section.title)}\n\n${bullets}`.trim();
  });

  return [
    `# OpenClaw ${params.version}`,
    "",
    "## Release Overview",
    "",
    `- Version: \`${params.version}\``,
    `- Tag: \`${params.tag}\``,
    ...(params.commit ? [`- Commit: \`${params.commit}\``] : []),
    `- Generated at (UTC): ${params.generatedAt}`,
    ...(links.length > 0 ? ["", ...links] : []),
    "",
    "## Artifacts",
    "",
    ...(artifactLines.length > 0 ? artifactLines : ["- No packaged artifacts were found."]),
    "",
    "## Included Changes",
    "",
    ...(changeSections.length > 0 ? changeSections : [params.changelog.markdown]),
    "",
  ].join("\n");
}

function buildChineseNotes(params: {
  version: string;
  tag: string;
  repo: string;
  commit: string;
  changelog: ParsedChangelogSection;
  artifacts: Array<{ name: string; size: number; sha256: string }>;
  generatedAt: string;
}): string {
  const summaryBits = params.changelog.headings.map(
    (section) => `${toChineseTitle(section.title)} ${section.bullets.length} 项`,
  );
  const artifactLines = params.artifacts.map(
    (artifact) => `- \`${artifact.name}\`（${artifact.size} 字节，sha256：\`${artifact.sha256}\`）`,
  );
  const sectionLines = params.changelog.headings.flatMap((section) => [
    `### ${toChineseTitle(section.title)}`,
    "",
    ...(section.bullets.length > 0 ? section.bullets.map((bullet) => `- ${bullet}`) : ["- 无"]),
    "",
  ]);

  return [
    `# OpenClaw ${params.version}`,
    "",
    "## 发布概览",
    "",
    `- 版本：\`${params.version}\``,
    `- 标签：\`${params.tag}\``,
    ...(params.commit ? [`- 提交：\`${params.commit}\``] : []),
    `- 生成时间（UTC）：${params.generatedAt}`,
    ...(summaryBits.length > 0 ? [`- 变更摘要：${summaryBits.join("，")}`] : []),
    ...(params.repo ? [`- 仓库：https://github.com/${params.repo}`] : []),
    "",
    "## 附件",
    "",
    ...(artifactLines.length > 0 ? artifactLines : ["- 未发现可发布的打包产物。"]),
    "",
    "## 版本说明",
    "",
    "下面保留本次版本的详细变更条目，便于直接发布到 GitHub Release；分类标题已中文化，条目内容保持原始英文，避免自动翻译失真。",
    "",
    ...sectionLines,
  ].join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const packageVersion = readPackageVersion();
  if (packageVersion && packageVersion !== options.version) {
    throw new Error(
      `package.json version ${packageVersion} does not match requested release version ${options.version}.`,
    );
  }

  const outputDir = resolve(options.outputDir);
  const artifactsDir = resolve(options.artifactsDir);
  mkdirSync(outputDir, { recursive: true });

  const changelog = extractChangelogSection(options.version);
  const artifacts = listArtifacts(artifactsDir);
  const generatedAt = formatUtcTimestamp(new Date());

  const english = buildEnglishNotes({
    version: options.version,
    tag: options.tag,
    repo: options.repo,
    commit: options.commit,
    changelog,
    artifacts,
    generatedAt,
  });
  const chinese = buildChineseNotes({
    version: options.version,
    tag: options.tag,
    repo: options.repo,
    commit: options.commit,
    changelog,
    artifacts,
    generatedAt,
  });

  const combined = [
    "## 中文说明",
    "",
    ...chinese.split(/\r?\n/),
    "",
    "---",
    "",
    "## English Notes",
    "",
    ...english.split(/\r?\n/),
    "",
  ].join("\n");

  const metadata = {
    version: options.version,
    tag: options.tag,
    repo: options.repo,
    commit: options.commit,
    changelogSource: changelog.version,
    generatedAt,
    artifacts: artifacts.map((artifact) => ({
      file: artifact.name,
      bytes: artifact.size,
      sha256: artifact.sha256,
    })),
  };

  writeFileSync(join(outputDir, "release-notes.en.md"), english);
  writeFileSync(join(outputDir, "release-notes.zh-CN.md"), chinese);
  writeFileSync(join(outputDir, "release-body.md"), combined);
  writeFileSync(join(outputDir, "release-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(`Generated release files in ${outputDir}`);
  for (const artifact of artifacts) {
    console.log(`- ${artifact.name}`);
  }
}

main();
