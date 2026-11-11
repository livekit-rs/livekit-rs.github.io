# 用 LiveKit SDK 接入应用

**客户端 SDK** 负责加入房间、发布本地音视频，以及订阅其他参与者的媒体轨道。**服务端 SDK** 在后端签发令牌和调用管理 API。浏览器只需要 WebSocket 地址和入房令牌。

## 选择平台教程

选择一个客户端，再用第二位参与者确认音视频确实收到。每篇教程都提供可下载的完整示例。

| 平台 | 教程 |
| --- | --- |
| React | [用 React 实现浏览器通话](sdk-react.zh-Hans.md) |
| Android | [用 Kotlin 实现 Android 通话](sdk-android.zh-Hans.md) |
| iOS | [用 SwiftUI 实现 iOS 通话](sdk-ios.zh-Hans.md) |
| Flutter | [用 Flutter 实现通话](sdk-flutter.zh-Hans.md) |

## 用两个浏览器标签页完成第一次通话

按[快速开始](guides.zh-Hans.md)启动 Rust 服务，再按 [CLI 指南](cli.zh-Hans.md)创建 `demo` 房间并生成两个令牌。两个令牌要使用不同的参与者身份。准备 Node.js、npm、Python 3，以及可以使用摄像头和麦克风的浏览器。

新建一个工作目录，把[浏览器示例](../examples/first-call.html)保存到该目录，文件名为 `first-call.html`。在目录中运行：

```sh
npm install --save-exact livekit-client@2.23.0
python3 -m http.server 8000 --bind 127.0.0.1
```

1. 在运行 Rust 服务的同一台电脑上，用两个标签页打开 [http://127.0.0.1:8000/first-call.html](http://127.0.0.1:8000/first-call.html)。
2. 服务地址保留 `ws://127.0.0.1:7880`。第一个标签页粘贴 Alice 的令牌，第二个粘贴 Bob 的令牌，分别点击 **加入**。
3. 在 Alice 的标签页点击 **开启摄像头和麦克风**，允许浏览器访问设备。Alice 会看到本地预览，Bob 应该在 **远端媒体** 下看到 Alice 的画面。如果浏览器拦截自动播放，在 Bob 的标签页点击 **播放声音**。使用耳机可以避免回声。
4. 测试完成后点击 **离开**，并在终端按 Ctrl+C 停止本地 Python 服务。

摄像头被占用时，可以只在一个标签页发布，另一个接收。连接失败时，检查 Rust 服务、令牌有效期和两个身份是否不同且属于同一房间。要从另一台设备访问，请部署 HTTPS 页面并使用可达的 `wss://` 地址。回环地址只在服务所在机器上有效。

## 用 Node.js 签发令牌和查询房间

把[服务端 SDK 示例](../examples/server-sdk.mjs)保存为工作目录下的 `server-sdk.mjs`。保持 Rust 服务运行，再执行：

```sh
npm install --save-exact livekit-server-sdk@2.19.3
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
node server-sdk.mjs list
node server-sdk.mjs token alice
```

`list` 通过 Room Service API 查询房间并打印房间名。`token alice` 输出 Alice 加入 `demo` 的 JWT，有效期为 10 分钟。Alice 离开后，可以用这个令牌替换 CLI 生成的令牌。为每个身份分别签发令牌。

接入自己的应用时，在后端提供需要登录的接口。从登录会话取得用户身份，确认用户可以加入指定房间，再用最少的权限签发短期令牌。通过 HTTPS 把 WebSocket 地址和令牌返回给客户端，API 密钥和管理调用留在后端。

## 选择客户端或后端 SDK

每个客户端都需要自己的入房令牌和可达的 WebSocket 地址。后端使用 HTTP 或 HTTPS API 地址及 API 凭据。上面的示例覆盖浏览器和 Node.js。使用其他 SDK 时，按对应文档安装，并结合[已发布的兼容性结果](compatibility.zh-Hans.md)验证你的应用。

| 应用类型 | SDK 和接入参考 |
| --- | --- |
| Web 或 React | [JavaScript 客户端 SDK](https://github.com/livekit/client-sdk-js) · [React 组件](https://github.com/livekit/components-js) |
| iOS 或 macOS | [Swift 客户端 SDK](https://github.com/livekit/client-sdk-swift) |
| Android | [Android 客户端 SDK](https://github.com/livekit/client-sdk-android) |
| Flutter | [Flutter 客户端 SDK](https://github.com/livekit/client-sdk-flutter) |
| Node.js 后端 | [Node.js 服务端 SDK](https://github.com/livekit/node-sdks/tree/main/packages/livekit-server-sdk) |
| Python、Go 或其他后端 | [LiveKit 服务端 API SDK](https://docs.livekit.io/reference/#server-apis) |
