# AoiMusic Relay

[AoiMusic](https://github.com/taratara19172008-cmyk/aoi-music) 的接口中转（部署在 Vercel）。

Apple Music 的网页播放器令牌只接受来自 `music.apple.com` 来源的请求，第三方网页直连会被 401 拦截。本服务在服务器端以该来源向苹果接口转发请求，并补上 CORS 头，让静态网页也能正常读取曲库数据。

- 入口：`api/relay.js`（Vercel Serverless Function）
- 用法：`/api/relay?target=<urlencoded 苹果接口完整地址>`
- 只允许转发到 `*.music.apple.com`；不存储、不记录任何令牌
