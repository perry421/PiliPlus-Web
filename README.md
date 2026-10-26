# PiliPlus Web

一个面向 iPhone Safari 的轻量 B 站网页入口。项目使用原生 HTML/CSS/JavaScript，不要求安装 IPA 或构建前端包。

> **非官方项目。** 本仓库与 PiliPlus / 哔哩哔哩无隶属关系，不是原生 PiliPlus 的网页版移植，不包含原生客户端的全部能力。

## 当前功能

- 响应式页面，适配 iPhone 安全区域、触屏和窄屏布局。
- 深色/浅色主题，可保存到本机浏览器。
- 搜索文字会跳转到 B 站公开搜索页。
- 识别 BV 号、av 号、常见 HTTPS B 站页面链接及 `b23.tv` 短链接。
- 支持本机收藏常用搜索词和 B 站入口（最多 30 个）。
- PWA manifest、应用图标、离线应用外壳缓存与网络状态提示。
- GitHub Actions 自动运行检查并部署 GitHub Pages。

## 明确不包含

- 不提供自己的 B 站 API 代理，也不声称可绕过登录、风控、付费或访问限制。
- 不保存 B 站 Cookie、密码、访问令牌或其他登录凭据。
- 不支持在本项目中缓存离线视频。
- 短链目标由 B 站短链服务跳转，静态网页不会提前解析或验证其最终去向。
- 视频播放、登录、弹幕、收藏、评论等具体能力取决于 B 站网页、浏览器与账号权限。

## 本地运行

需要 Node.js 20+。项目本体为静态文件。

```sh
npm run check
python3 -m http.server 8080
```

然后打开 `http://localhost:8080`。PWA Service Worker 只会在 HTTPS 或 localhost 等安全上下文中启用。

## 测试

```sh
npm test
```

使用 Node 内置测试框架，不需安装运行时依赖。

## 部署到 GitHub Pages

若本地 GitHub CLI 已登录，可在项目目录直接运行 `./scripts/publish.sh`。脚本会先跑测试；在目标仓库不存在时创建 `perry421/PiliPlus-Web`，启用 GitHub Pages workflow 构建，推送 `main` 并等待对应工作流。创建仓库和启用 Pages 需要 GitHub CLI 具备相应权限。脚本只有在 Actions 成功后才报告部署成功。

手动部署步骤：

1. 将本仓库推送到 GitHub 的 `main` 分支。
2. 打开 **Settings → Pages**，将 Build and deployment source 设置为 **GitHub Actions**。
3. 在 **Actions** 页面确认 `Deploy PiliPlus Web to GitHub Pages` 工作流成功。
4. 成功后，地址通常为 `https://<账号>.github.io/<仓库名>/`；请以 GitHub Pages 实际提供的地址为准。

工作流只部署静态文件，不上传仓库外内容。

## 添加到 iPhone 主屏幕

使用 iPhone 的 Safari 打开部署网址 → 分享 → 添加到主屏幕 → 添加。该操作无需安装 IPA。主屏幕模式的实际表现仍取决于 iOS / Safari 版本。

## 隐私

收藏与主题仅写入当前浏览器的 `localStorage`。没有账号系统、分析 SDK、第三方登录、外部字体请求或服务器端数据存储。搜索和点击入口时，用户会离开本站并访问 B 站。

## License

本项目自有代码采用 MIT License。Bilibili、PiliPlus 及其商标、服务和内容归各自权利人所有。
