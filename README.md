# 🦞 CClaw / OpenClaw —— 个人 AI 助手

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text-dark.png">
        <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.png" alt="OpenClaw" width="500">
    </picture>
</p>

<p align="center">
  <strong>中文默认文档 / Chinese-first README</strong>
</p>

<p align="center">
  <a href="https://github.com/MissChina/CClaw/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://img.shields.io/github/actions/workflow/status/MissChina/CClaw/ci.yml?branch=main&style=for-the-badge" alt="CI 状态"></a>
  <a href="https://github.com/MissChina/CClaw/releases"><img src="https://img.shields.io/github/v/release/MissChina/CClaw?include_prereleases&style=for-the-badge" alt="GitHub 发布"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

## 这是什么

**CClaw / OpenClaw** 是一个运行在你自己设备上的个人 AI 助手。

它不是单纯的网页聊天框，而是一个可以长期运行、接入你日常聊天渠道与设备能力的个人助手系统。它可以连接 WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、Feishu、LINE、Mattermost、WebChat 等渠道，也支持 macOS / iOS / Android 的语音、画布、节点与设备能力。

如果你想要的是一个：

- **本地感强**
- **响应快**
- **持续在线**
- **单用户优先**
- **可控、可扩展、可自托管**

的 AI 助手，这个项目就是为这个目标设计的。

## 当前仓库重点

当前这个 fork 重点做的是：

1. **中文优先文档体验**
2. **GitHub Actions 自动发布链优化**
3. **更适合中文开发者排障的日志输出**
4. **控制台 / UI 本地化体验打磨**

## 文档入口

- 中文文档入口：[`docs/readme.zh-cn.md`](docs/readme.zh-cn.md)
- 自动发布说明：[`docs/release-automation.md`](docs/release-automation.md)
- 当前推进计划：[`docs/plan.md`](docs/plan.md)
- 官方文档站：<https://docs.openclaw.ai>

如果你需要英文入口，可查看：

- 官方英文文档站：<https://docs.openclaw.ai>
- 上游项目主页：<https://github.com/openclaw/openclaw>

## 快速开始

### 环境要求

- **Node >= 22**
- 推荐使用 `pnpm`

### 安装

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

### 初始化

```bash
openclaw onboard --install-daemon
```

### 启动网关

```bash
openclaw gateway --port 18789 --verbose
```

### 常见操作

```bash
# 发送消息
openclaw message send --to +1234567890 --message "Hello from OpenClaw"

# 让助手执行任务
openclaw agent --message "Ship checklist" --thinking high
```

## 自动发布（当前仓库策略）

当前仓库的目标是：

- 推送到 `main`
- 自动读取 `package.json.version`
- 自动创建对应 tag（`v<version>`）
- 自动生成打包产物
- 自动生成中英 release notes
- 自动创建 GitHub Release

详细说明见：[`docs/release-automation.md`](docs/release-automation.md)

## 日志与排障

当前仓库已经开始补充**中文友好调试日志**，优先覆盖：

- Gateway 启动信息
- Secret 运行时加载失败 / 恢复
- 日志文件达到大小上限

如果遇到问题，优先检查：

- GitHub Actions 页面
- `docs/release-automation.md`
- `docs/plan.md`
- Gateway 启动时输出的日志文件路径

## 关于 Pull Requests

当前仓库会优先处理：

- GitHub Actions / Release 相关依赖更新
- 影响当前启用主线流程的 Dependabot PR

对于影响面过大的 Android / Swift / 平台级升级，会在主线稳定后再逐步吸收。

## English note

This repository now uses a **Chinese-first README** by default.
For full upstream English documentation, use:

- <https://docs.openclaw.ai>
- <https://github.com/openclaw/openclaw>
