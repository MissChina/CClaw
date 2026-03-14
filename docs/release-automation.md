# Release Automation / 自动发布说明

## English

This repository is configured toward a release-first GitHub Actions flow.

### Goal

When changes land on `main`, the workflow should automatically:

1. read `package.json.version`
2. create the corresponding Git tag (`v<version>`)
3. build and validate the package
4. generate release assets
5. generate bilingual release notes (English + Chinese)
6. publish a GitHub Release

### Why this exists

The upstream repository contains many heavy workflows. For this fork, the priority is different:

- faster feedback
- fewer noisy workflow runs
- release automation that is easier to operate
- documentation that is friendlier to Chinese-speaking developers

### Current workflow focus

- `CI`: lighter default checks
- `GitHub Release`: automatic tag + release generation on `main`
- `Docker Release`: release-oriented trigger
- `OpenClaw NPM Release`: manual guarded publish

### Notes

If a release fails, check these first:

- workflow trigger conditions
- whether `package.json.version` is valid
- whether the release tag already exists
- whether GitHub Actions permissions allow writing tags/releases
- network stability when pushing to GitHub

---

## 中文

这个仓库当前采用的是 **发布优先** 的 GitHub Actions 流程。

### 目标

当代码进入 `main` 后，工作流应自动完成：

1. 读取 `package.json.version`
2. 创建对应 Git tag（`v<版本号>`）
3. 构建并校验产物
4. 生成 release 附件
5. 生成中英双语 release notes
6. 发布 GitHub Release

### 为什么这样设计

上游仓库自带很多很重的工作流；但这个 fork 当前更关注：

- 更快的反馈速度
- 更少的 workflow 噪音
- 更好维护的自动发布链
- 对中文开发者更友好的文档和调试体验

### 当前重点工作流

- `CI`：默认只保留较轻量的检查
- `GitHub Release`：在 `main` 上自动处理 tag + release
- `Docker Release`：面向正式发布触发
- `OpenClaw NPM Release`：保留人工确认，避免误发包

### 如果发布失败，优先检查

- workflow 触发条件是否正确
- `package.json.version` 是否有效
- 对应 release tag 是否已经存在
- GitHub Actions 是否有写入 tag / release 的权限
- 推送到 GitHub 时的网络稳定性
