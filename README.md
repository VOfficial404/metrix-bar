# Metrix.Bar 看板

个人 [Metrix.Bar](https://metrix.bar/) 菜单栏与系统托盘看板集合。

## 看板

| 看板 | 功能 | 自动刷新 |
| --- | --- | --- |
| [BiliBili](dashboards/bilibili/README.md) | 扫码登录；账户与粉丝指标、投稿统计、未读消息及最近私信、可按作者筛选的动态；页面可排序、按需开关 | 整体可自定义 1–1440 分钟，默认 1 小时；私信独立配置，默认 10 分钟 |

## 安装

1. 打开 **Metrix.Bar → 设置 → 看板源**。
2. 添加以下索引地址，安装 BiliBili 看板。
3. 按[模块说明](dashboards/bilibili/README.md)扫码登录并配置页面。

```text
https://raw.githubusercontent.com/VOfficial404/metrix-bar/main/registry/index.json
```

也可将以下地址复制到浏览器，唤起 Metrix.Bar 添加看板源：

```text
metrixbar://registry/add?url=https%3A%2F%2Fraw.githubusercontent.com%2FVOfficial404%2Fmetrix-bar%2Fmain%2Fregistry%2Findex.json
```

看板源安装支持后续更新；直接导入 `.bar` 的实例独立保存凭据，不与源安装实例建立相同的更新关联。

## 开发

使用 [Bun](https://bun.sh/)，在仓库根目录运行：

```sh
bun test
bun run build
```

- `dashboards/<模块>/`：唯一业务源码、用户说明与预览。
- `tests/`：行为测试和隔离数据；真实凭据不得写入测试或仓库。
- `registry/`：构建索引及按 SHA-256 命名的发布文件。源码与新增产物一起提交，保留历史文件供缓存索引使用。

构建只检查静态产物；原生交互与布局还需在 Metrix.Bar 中验证。维护与发布规则见 [AGENTS.md](AGENTS.md)，详细验证入口见[模块说明](dashboards/bilibili/README.md)。

## 文档与许可

[更新记录](CHANGELOG.md) · [维护约定](AGENTS.md) · [第三方声明](dashboards/bilibili/THIRD_PARTY_NOTICES.md)

项目使用 [AGPL-3.0-only](LICENSE)。
