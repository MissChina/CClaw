# CClaw / OpenClaw 中文说明

> 这是面向中文使用者的快速入口文档。英文主文档仍然保留在仓库根目录 `README.md`。

## 项目是什么

OpenClaw 是一个运行在你自己设备上的个人 AI 助手系统。

它的目标不是做一个“网页上的聊天框”，而是做一个真正长期在线、能接入你日常渠道和设备能力的个人助手。你可以把它连接到 WhatsApp、Telegram、Slack、Discord、Signal、Feishu、LINE、Mattermost、WebChat 等渠道，也可以接入 macOS / iOS / Android 设备能力、语音能力和 Canvas 可视化界面。

## 仓库当前重点

当前这个仓库版本的工作重点包括：

1. 控制台 / Control UI 体验优化
2. 中英双语文档入口
3. GitHub Actions 自动发布链路
4. 更适合中文开发者排障的后台日志提示

## 快速开始

### 安装

运行环境：**Node >= 22**

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

## 自动发布说明

本仓库当前的 GitHub Actions 发布目标是：

- 推送到 `main` 后，自动识别 `package.json` 版本
- 自动创建对应的 release tag（如 `v2026.3.14`）
- 自动打包产物
- 自动生成中英 release notes
- 自动创建 GitHub Release

详细说明见：[`docs/release-automation.md`](./release-automation.md)

## 文档语言策略

目前采用：

- 英文主文档继续保留
- 中文补充高频入口文档
- 中英并存，而不是简单用中文覆盖英文

这样做的好处是：

- 对中文开发者更友好
- 保留和上游英文生态的兼容性
- 发布、协作、搜索资料时不会断层

## 排障建议

如果你在 GitHub Actions、发布、打包或网关启动时遇到问题，优先关注：

- `README.md`
- `docs/release-automation.md`
- GitHub Actions 页面里的 `CI` / `GitHub Release` / `Docker Release`
- 本项目启动日志中的中英双语提示

## 后续计划

- 继续扩展中英双语文档范围
- 继续清理和吸收剩余 dependabot PR
- 持续优化发布链的稳定性和可观测性
