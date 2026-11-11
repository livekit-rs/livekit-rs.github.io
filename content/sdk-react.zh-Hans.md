# 用 React 完成第一次通话

## 启动 livekit-rs 并获取两个令牌

按[快速开始](guides.zh-Hans.md)用开发模式启动 livekit-rs。在另一个已安装[官方 CLI](cli.zh-Hans.md) 的终端运行：

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity react-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

复制每条命令输出中 `Access token:` 后的 JWT。新应用使用 `react-alice`，[浏览器示例](sdk.zh-Hans.md#用两个浏览器标签页完成第一次通话)使用 `browser-bob`。令牌过期后重新运行对应命令。两位参与者要用不同身份加入同一个 `demo` 房间。上述凭据只用于本地开发。接入自己的应用时，请在[需要登录的后端签发令牌](sdk.zh-Hans.md#用-nodejs-签发令牌和查询房间)，只把 WebSocket 地址和参与者令牌发给客户端。

## 安装 React 和 LiveKit 组件

使用 Node.js 24 和 npm。创建 JavaScript React 项目并安装 SDK 和界面组件：

```sh
npm create vite@9.3.4 react-call -- --template react --no-interactive
cd react-call
npm install
npm install --save-exact livekit-client@2.23.0 @livekit/components-react@2.9.25 @livekit/components-styles@1.2.0
```

下载 [FirstCall.jsx](../examples/FirstCall.jsx)，用它替换生成的 `src/App.jsx`。删除 `src/main.jsx` 中的 `import './index.css'`，避免模板样式限制会议界面。启动开发服务：

```sh
npm run dev -- --host 127.0.0.1
```

## 加入房间并收发音视频

1. 打开终端输出的 Vite 地址，通常是 `http://127.0.0.1:5173`。**Server URL** 保留 `ws://127.0.0.1:7880`，粘贴 `react-alice` 的令牌，点击 **Join**。
2. 在第二个标签页打开浏览器示例，用 `browser-bob` 的令牌入房。
3. 用 React 控制栏开启摄像头和麦克风，并允许浏览器访问设备。Bob 应该能看到并听到 Alice。如果设备无法同时供两个页面使用，先关闭 Alice 的摄像头，再开启 Bob 的摄像头和麦克风，确认 Alice 能收到。使用耳机或轮流发布，避免回声。
4. 在两个客户端点击 **Leave**，在终端按 Ctrl+C 停止 Vite。

`LiveKitRoom` 建立连接并为子组件提供房间状态。`VideoConference` 渲染订阅的视频、播放订阅的音频，并提供发布本地媒体的控制按钮。浏览器拦截自动播放时，按会议界面提示开启声音。找不到设备时，检查浏览器和操作系统的摄像头、麦克风权限。部署后通过 HTTPS 提供网页，并连接服务端的 `wss://` 地址。

[LiveKit React 组件参考](https://docs.livekit.io/reference/components/react/)
