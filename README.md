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

**CClaw / OpenClaw** 是一个运行在你自己设备上的个人 AI 助手。

它可以接入你已经在用的聊天渠道（WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、BlueBubbles、IRC、Microsoft Teams、Matrix、Feishu、LINE、Mattermost、Nextcloud Talk、Nostr、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal、WebChat），也可以接入 macOS / iOS / Android 的语音、画布和设备能力。Gateway 只是控制平面，真正的产品是这个长期陪伴你的助手。

如果你想要的是一个 **本地感强、响应快、持续在线、单用户优先、可自托管** 的 AI 助手，这个项目就是为此设计的。

## 文档入口

- 中文文档入口：[`docs/readme.zh-cn.md`](docs/readme.zh-cn.md)
- 自动发布说明：[`docs/release-automation.md`](docs/release-automation.md)
- 当前推进计划：[`docs/plan.md`](docs/plan.md)
- 官方文档站：<https://docs.openclaw.ai>
- 上游项目主页：<https://github.com/openclaw/openclaw>
- 愿景说明：[`VISION.md`](VISION.md)
- DeepWiki：<https://deepwiki.com/openclaw/openclaw>
- 快速开始：<https://docs.openclaw.ai/start/getting-started>
- 更新说明：<https://docs.openclaw.ai/install/updating>
- Showcase：<https://docs.openclaw.ai/start/showcase>
- FAQ：<https://docs.openclaw.ai/help/faq>
- Wizard：<https://docs.openclaw.ai/start/wizard>
- Docker：<https://docs.openclaw.ai/install/docker>
- Discord 社区：<https://discord.gg/clawd>

## 当前仓库重点

当前这个 fork 重点在：

1. **中文优先文档体验**
2. **GitHub Actions 自动发布链优化**
3. **更适合中文开发者排障的日志输出**
4. **控制台 / UI 本地化体验打磨**

## 安装（推荐）

运行环境：**Node >= 22**。

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

推荐直接运行引导向导：

```bash
openclaw onboard --install-daemon
```

它会一步一步帮你完成 gateway、workspace、channels、skills 的初始化。对大多数用户来说，这是最省事的路径。

## 快速开始（TL;DR）

```bash
openclaw onboard --install-daemon

openclaw gateway --port 18789 --verbose

# 发送消息
openclaw message send --to +1234567890 --message "Hello from OpenClaw"

# 让助手执行任务
openclaw agent --message "Ship checklist" --thinking high
```

如果你是新安装用户，建议先看：<https://docs.openclaw.ai/start/getting-started>

## 开发渠道

- **stable**：正式发布版本（tag 形式通常为 `vYYYY.M.D` 或 `vYYYY.M.D-<patch>`），npm dist-tag 为 `latest`
- **beta**：预发布版本（例如 `vYYYY.M.D-beta.N`），npm dist-tag 为 `beta`
- **dev**：`main` 分支的滚动头部，必要时会对应 npm dist-tag `dev`

切换渠道：

```bash
openclaw update --channel stable|beta|dev
```

更多说明：<https://docs.openclaw.ai/install/development-channels>

## 从源码运行（开发模式）

推荐使用 `pnpm` 从源码构建。Bun 可选，主要用于直接运行 TypeScript。

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw

pnpm install
pnpm ui:build # 首次运行会自动安装 UI 依赖
pnpm build

pnpm openclaw onboard --install-daemon

# 开发循环（监听 TS 变更）
pnpm gateway:watch
```

说明：

- `pnpm openclaw ...` 会通过 `tsx` 直接运行 TypeScript
- `pnpm build` 会生成 `dist/`，用于 Node 或打包后的 `openclaw` 二进制

## 安全默认值（DM 访问）

OpenClaw 连接的是真实聊天渠道，所以所有入站私聊都应该默认视为**不可信输入**。

完整安全文档：<https://docs.openclaw.ai/gateway/security>

默认情况下，在 Telegram / WhatsApp / Signal / iMessage / Microsoft Teams / Discord / Google Chat / Slack 上：

- 未知发送者通常会先走 **DM pairing**
- 对方会收到一个短配对码，机器人不会直接处理消息
- 需要你显式批准后，发送者才会进入 allowlist

如果想排查风险配置，可以运行：

```bash
openclaw doctor
```

## 主要亮点

- **Local-first Gateway**：单一控制平面，统一管理 sessions、channels、tools、events
- **多渠道收件箱**：支持大量主流聊天平台和自托管渠道
- **多智能体路由**：可以把不同入口路由到不同 agent / workspace
- **Voice Wake + Talk Mode**：支持语音唤醒、持续语音、系统 TTS 等
- **Live Canvas**：支持由 agent 驱动的可视化工作区
- **一等工具系统**：浏览器、canvas、nodes、cron、sessions、Discord/Slack actions 等
- **伴生应用与节点**：macOS 菜单栏、iOS / Android 节点、远程设备能力
- **Skills 平台**：支持 bundled / managed / workspace 三类技能

## 已构建能力概览

### 核心平台

- Gateway WS 控制平面：sessions、presence、config、cron、webhooks、Control UI、Canvas host
- CLI：gateway、agent、send、wizard、doctor
- Pi agent runtime：RPC 模式、tool streaming、block streaming
- 会话模型：`main`、群聊隔离、激活模式、队列模式、reply-back
- 媒体管线：图片 / 音频 / 视频、转录、大小限制、临时文件生命周期

### 渠道

支持或可接入：

- WhatsApp
- Telegram
- Slack
- Discord
- Google Chat
- Signal
- BlueBubbles / iMessage
- IRC
- Microsoft Teams
- Matrix
- Feishu
- LINE
- Mattermost
- Nextcloud Talk
- Nostr
- Synology Chat
- Tlon
- Twitch
- Zalo / Zalo Personal
- WebChat

### App + Nodes

- macOS app：菜单栏控制、Voice Wake / PTT / Talk Mode / WebChat / debug tools
- iOS node：Canvas、语音、相机、录屏、Bonjour、设备配对
- Android node：连接、聊天、语音、Canvas、相机、设备控制
- macOS node mode：system.run / notify + canvas / camera 能力

### 工具与自动化

- 浏览器控制
- Canvas 推送 / reset / eval / snapshot
- Nodes：camera、screen recording、location、notifications
- Cron + wakeups
- Webhooks
- Gmail Pub/Sub
- Skills 安装与管理

### 运行时与安全

- 渠道路由
- retry policy
- streaming / chunking
- presence / typing indicators
- usage tracking
- models / model failover / session pruning
- security / troubleshooting

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
- Release / workflow 相关问题的排查上下文

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
