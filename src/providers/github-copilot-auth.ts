import { intro, note, outro, spinner } from "@clack/prompts";
import { ensureAuthProfileStore, upsertAuthProfile } from "../agents/auth-profiles.js";
import type { AuthProfileStore, TokenCredential } from "../agents/auth-profiles.js";
import { updateConfig } from "../commands/models/shared.js";
import { applyAuthProfileConfig } from "../commands/onboard-auth.js";
import { logConfigUpdated } from "../config/logging.js";
import type { RuntimeEnv } from "../runtime.js";
import { stylePromptTitle } from "../terminal/prompt-style.js";

const CLIENT_ID = "Iv1.b507a08c87ecfe98";
const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type DeviceTokenResponse =
  | {
      access_token: string;
      token_type: string;
      scope?: string;
    }
  | {
      error: string;
      error_description?: string;
      error_uri?: string;
    };

type GitHubViewerResponse = {
  id?: number;
  login?: string;
  name?: string | null;
  email?: string | null;
};

type GitHubViewerIdentity = {
  id: string;
  login: string;
  name?: string;
  email?: string;
};

type ExistingCopilotProfileMatch = {
  profileId: string;
  credential: TokenCredential;
  reason: "profile-id" | "user-id" | "login" | "email";
};

function parseJsonResponse<T>(value: unknown): T {
  if (!value || typeof value !== "object") {
    throw new Error("Unexpected response from GitHub");
  }
  return value as T;
}

function normalizeProfileSuffix(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionalText(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function requestDeviceCode(params: { scope: string }): Promise<DeviceCodeResponse> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: params.scope,
  });

  const res = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`GitHub device code failed: HTTP ${res.status}`);
  }

  const json = parseJsonResponse<DeviceCodeResponse>(await res.json());
  if (!json.device_code || !json.user_code || !json.verification_uri) {
    throw new Error("GitHub device code response missing fields");
  }
  return json;
}

async function pollForAccessToken(params: {
  deviceCode: string;
  intervalMs: number;
  expiresAt: number;
}): Promise<string> {
  const bodyBase = new URLSearchParams({
    client_id: CLIENT_ID,
    device_code: params.deviceCode,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  });

  while (Date.now() < params.expiresAt) {
    const res = await fetch(ACCESS_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyBase,
    });

    if (!res.ok) {
      throw new Error(`GitHub device token failed: HTTP ${res.status}`);
    }

    const json = parseJsonResponse<DeviceTokenResponse>(await res.json());
    if ("access_token" in json && typeof json.access_token === "string") {
      return json.access_token;
    }

    const err = "error" in json ? json.error : "unknown";
    if (err === "authorization_pending") {
      await new Promise((r) => setTimeout(r, params.intervalMs));
      continue;
    }
    if (err === "slow_down") {
      await new Promise((r) => setTimeout(r, params.intervalMs + 2000));
      continue;
    }
    if (err === "expired_token") {
      throw new Error("GitHub device code expired; run login again");
    }
    if (err === "access_denied") {
      throw new Error("GitHub login cancelled");
    }
    throw new Error(`GitHub device flow error: ${err}`);
  }

  throw new Error("GitHub device code expired; run login again");
}

async function fetchGitHubViewerIdentity(accessToken: string): Promise<GitHubViewerIdentity> {
  const res = await fetch(GITHUB_USER_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "OpenClaw-GitHub-Copilot-Login",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to resolve GitHub account identity: HTTP ${res.status}`);
  }

  const json = parseJsonResponse<GitHubViewerResponse>(await res.json());
  const login = normalizeOptionalText(json.login);
  const id = typeof json.id === "number" && Number.isFinite(json.id) ? String(json.id) : "";
  if (!login || !id) {
    throw new Error("GitHub account identity response missing login/id");
  }

  return {
    id,
    login,
    name: normalizeOptionalText(json.name) ?? undefined,
    email: normalizeOptionalText(json.email) ?? undefined,
  };
}

function buildCanonicalCopilotProfileId(identity: GitHubViewerIdentity): string {
  const suffix = normalizeProfileSuffix(identity.login) || identity.id;
  return `github-copilot:${suffix}`;
}

function findExistingCopilotProfileByIdentity(params: {
  store: AuthProfileStore;
  identity: GitHubViewerIdentity;
  requestedProfileId?: string;
}): ExistingCopilotProfileMatch | null {
  const requestedProfileId = params.requestedProfileId?.trim();
  const normalizedLogin = params.identity.login.toLowerCase();
  const normalizedEmail = params.identity.email?.toLowerCase();

  for (const [profileId, credential] of Object.entries(params.store.profiles)) {
    if (credential.provider !== "github-copilot" || credential.type !== "token") {
      continue;
    }

    const tokenCredential = credential;
    const metadata = tokenCredential.metadata ?? {};
    const storedUserId = metadata.githubUserId?.trim();
    const storedLogin = metadata.githubLogin?.trim().toLowerCase();
    const storedEmail = tokenCredential.email?.trim().toLowerCase();

    if (requestedProfileId && profileId === requestedProfileId) {
      return { profileId, credential: tokenCredential, reason: "profile-id" };
    }
    if (storedUserId && storedUserId === params.identity.id) {
      return { profileId, credential: tokenCredential, reason: "user-id" };
    }
    if (storedLogin && storedLogin === normalizedLogin) {
      return { profileId, credential: tokenCredential, reason: "login" };
    }
    if (normalizedEmail && storedEmail && storedEmail === normalizedEmail) {
      return { profileId, credential: tokenCredential, reason: "email" };
    }
  }

  return null;
}

function buildCopilotTokenCredential(params: {
  accessToken: string;
  identity: GitHubViewerIdentity;
}): TokenCredential {
  return {
    type: "token",
    provider: "github-copilot",
    token: params.accessToken,
    email: params.identity.email,
    metadata: {
      githubLogin: params.identity.login,
      githubUserId: params.identity.id,
      ...(params.identity.name ? { githubName: params.identity.name } : {}),
    },
    // GitHub device flow token doesn't reliably include expiry here.
    // Leave expires unset; we'll exchange into Copilot token plus expiry later.
  } as TokenCredential;
}

function formatIdentityLabel(identity: GitHubViewerIdentity): string {
  const bits = [identity.login];
  if (identity.name && identity.name !== identity.login) {
    bits.push(identity.name);
  }
  if (identity.email) {
    bits.push(identity.email);
  }
  return bits.join(" / ");
}

export async function githubCopilotLoginCommand(
  opts: { profileId?: string; yes?: boolean },
  runtime: RuntimeEnv,
) {
  if (!process.stdin.isTTY) {
    throw new Error("github-copilot login requires an interactive TTY.");
  }

  intro(stylePromptTitle("GitHub Copilot login"));

  const requestedProfileId = opts.profileId?.trim();
  const store = ensureAuthProfileStore(undefined, {
    allowKeychainPrompt: false,
  });

  if (requestedProfileId && store.profiles[requestedProfileId] && !opts.yes) {
    note(
      `Auth profile already exists: ${requestedProfileId}\nRe-running may update the same profile or reuse it if the GitHub account matches.`,
      stylePromptTitle("Existing credentials"),
    );
  }

  const spin = spinner();
  spin.start("Requesting device code from GitHub...");
  const device = await requestDeviceCode({ scope: "read:user" });
  spin.stop("Device code ready");

  note(
    [`Visit: ${device.verification_uri}`, `Code: ${device.user_code}`].join("\n"),
    stylePromptTitle("Authorize"),
  );

  const expiresAt = Date.now() + device.expires_in * 1000;
  const intervalMs = Math.max(1000, device.interval * 1000);

  const polling = spinner();
  polling.start("Waiting for GitHub authorization...");
  const accessToken = await pollForAccessToken({
    deviceCode: device.device_code,
    intervalMs,
    expiresAt,
  });
  polling.stop("GitHub access token acquired");

  const identitySpin = spinner();
  identitySpin.start("Resolving GitHub account identity...");
  const identity = await fetchGitHubViewerIdentity(accessToken);
  identitySpin.stop(`GitHub account resolved: ${identity.login}`);

  const canonicalProfileId = buildCanonicalCopilotProfileId(identity);
  const existingMatch = findExistingCopilotProfileByIdentity({
    store,
    identity,
    requestedProfileId,
  });
  const profileId = existingMatch?.profileId ?? requestedProfileId ?? canonicalProfileId;
  const credential = buildCopilotTokenCredential({ accessToken, identity });

  upsertAuthProfile({
    profileId,
    credential,
  });

  await updateConfig((cfg) =>
    applyAuthProfileConfig(cfg, {
      provider: "github-copilot",
      profileId,
      mode: "token",
    }),
  );

  logConfigUpdated(runtime);

  if (existingMatch) {
    note(
      [
        `Detected existing GitHub Copilot account: ${formatIdentityLabel(identity)}`,
        `Reused profile: ${profileId}`,
        `Reason: matched by ${existingMatch.reason}`,
        requestedProfileId && requestedProfileId !== profileId
          ? `Requested profile ${requestedProfileId} was not duplicated; existing canonical profile was updated instead.`
          : "Stored token was updated in place to keep auth profile state consistent.",
      ].join("\n"),
      stylePromptTitle("Account already known"),
    );
  } else {
    note(
      [
        `Signed in GitHub Copilot account: ${formatIdentityLabel(identity)}`,
        `Stored auth profile: ${profileId}`,
        profileId !== canonicalProfileId
          ? `Canonical suggested profile would be ${canonicalProfileId}; current run kept the requested profile id.`
          : "Profile id matches the resolved GitHub account for stable multi-account storage.",
      ].join("\n"),
      stylePromptTitle("Account stored"),
    );
  }

  runtime.log(`Auth profile: ${profileId} (github-copilot/token)`);
  runtime.log(`GitHub account: ${identity.login} (${identity.id})`);

  outro("Done");
}
