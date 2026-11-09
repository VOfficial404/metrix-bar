# Metrix.Bar 看板

个人 [Metrix.Bar](https://metrix.bar/) 菜单栏与系统托盘看板集合。

## 看板

| 看板 | 介绍 |
| --- | --- |
| [BiliBili](dashboards/bilibili/) | 扫码登录，按需启用账户指标、粉丝、视频和未读消息。每 6 小时刷新。 |

## 安装

在 **Metrix.Bar → 设置 → 看板源** 中添加：

```text
https://raw.githubusercontent.com/VOfficial404/metrix-bar/main/registry/index.json
```

或复制以下地址到浏览器打开：

```text
metrixbar://registry/add?url=https%3A%2F%2Fraw.githubusercontent.com%2FVOfficial404%2Fmetrix-bar%2Fmain%2Fregistry%2Findex.json
```

各看板的登录方式、使用说明和预览见对应目录；BiliBili 的[功能开关与配置](dashboards/bilibili/README.md#按需开启功能)集中在模块 README。

## 开发

源码位于 `dashboards/<看板>/`。修改后运行 `bun test` 和 `bun run build`，将源码与 `registry/` 构建产物一同提交。发布文件按 SHA-256 命名，保留历史文件供缓存索引使用。

维护约定见 [AGENTS.md](AGENTS.md)。

[AGPL-3.0-only](LICENSE) · [更新记录](CHANGELOG.md)
