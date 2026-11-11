# 用 iOS 完成第一次通话

## 启动 livekit-rs 并获取两个令牌

按[快速开始](guides-build-locally.zh-Hans.md)用开发模式启动 livekit-rs。在另一个已安装[官方 CLI](cli.zh-Hans.md) 的终端运行：

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity ios-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

复制每条命令输出中 `Access token:` 后的 JWT。新应用使用 `ios-alice`，[浏览器示例](sdk.zh-Hans.md#用两个浏览器标签页完成第一次通话)使用 `browser-bob`。令牌过期后重新运行对应命令。两位参与者要用不同身份加入同一个 `demo` 房间。上述凭据只用于本地开发。接入自己的应用时，请在[需要登录的后端签发令牌](sdk.zh-Hans.md#用-nodejs-签发令牌和查询房间)，只把 WebSocket 地址和参与者令牌发给客户端。

## 创建 SwiftUI 应用

使用 Xcode 16.3 或更高版本。新建 **iOS → App** 项目，选择 **SwiftUI** 和 **Swift**，最低部署版本设为 iOS 17。在 **File → Add Package Dependencies** 中输入 SDK 地址：

```text
https://github.com/livekit/client-sdk-swift.git
```

选择 **Exact Version** `2.19.0`，把 **LiveKit** 产品添加到应用 target。用下载的 [ContentView.swift](../examples/ContentView.swift) 替换模板生成的同名文件，保留模板里的应用入口。

在应用 target 的 **Info** 标签页添加下表中的配置。项目使用独立的 `Info.plist` 时，在文件中加入相同的键。

| 键 | 类型 | 示例值 |
| --- | --- | --- |
| `NSCameraUsageDescription` | String | 在房间里分享我的摄像头画面。 |
| `NSMicrophoneUsageDescription` | String | 在房间里分享我的麦克风声音。 |
| `NSLocalNetworkUsageDescription` | String | 连接本地网络中的开发服务。 |
| `NSAppTransportSecurity` → `NSAllowsLocalNetworking` | 字典中的 Boolean | 本地开发版本设为 YES |

## 运行应用并验证音视频

1. 构建并运行到 iOS 模拟器。**Server URL** 保留 `ws://127.0.0.1:7880`，用于连接 Mac。粘贴 `ios-alice` 的令牌并点击 **Join**。
2. 用浏览器示例作为 Bob 入房并发布，检查模拟器能否看到和听到 Bob。即使模拟器没有可用于发布的摄像头，也可以验证订阅。
3. 验证 iPhone 发布时，在真机运行应用，填写证书受信且可达的 `wss://` 服务地址。用该部署的凭据为两端重新签发令牌。两端加入同一房间后，在 iPhone 点击 **Publish camera and microphone** 并授予权限。Bob 应能看到并听到手机，再让 Bob 发布，确认手机也能收到。
4. 两端都点击 **Leave**。如果之前拒绝了采集权限，先到系统设置中开启，再重试。

示例通过 SwiftUI 观察房间参与者和已订阅的视频发布项。`SwiftUIVideoView` 渲染可用的视频轨道，SDK 播放订阅的音频。真机的回环地址指向手机本身，真机测试时使用部署地址。

[LiveKit Swift SDK 参考](https://github.com/livekit/client-sdk-swift)
