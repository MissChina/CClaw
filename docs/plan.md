# 当前推进计划 / Current plan

## 1. GitHub Actions / 发布链

- 保持 `push -> auto tag -> auto release` 主链路
- 持续压缩不必要的 workflow 触发面
- 优先吸收与当前启用 workflows 直接相关的 dependabot 更新

## 2. Pull requests（Dependabot）处理策略

### 已吸收
- actions/checkout
- actions/upload-artifact
- docker/login-action
- actions/setup-java
- Android uiautomator 小版本升级

### 暂缓整包合入
- Android 大版本依赖组升级
- macOS / Swift 依赖组整体升级

原因：这些改动面更大，应该在发布链稳定后逐步吸收，而不是和当前主目标捆绑爆炸。

## 3. 中英双语文档

### 已完成
- README 双语入口
- `docs/readme.zh-cn.md`
- `docs/release-automation.md`

### 下一步
- 补开发/发布/排障相关高频入口
- 给 release / workflow / logging 做中英说明补充

## 4. 中文友好日志

### 已完成
- gateway startup 关键日志
- secrets degraded / recovered 提示
- log file size cap 提示

### 下一步
- release / workflow 失败点提示
- 常见配置错误和权限错误提示
