# 用 Flutter 完成第一次通话

## 启动 livekit-rs 并获取两个令牌

按[快速开始](guides.zh-Hans.md)用开发模式启动 livekit-rs。在另一个已安装[官方 CLI](cli.zh-Hans.md) 的终端运行：

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity flutter-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

复制每条命令输出中 `Access token:` 后的 JWT。新应用使用 `flutter-alice`，[浏览器示例](sdk.zh-Hans.md#用两个浏览器标签页完成第一次通话)使用 `browser-bob`。令牌过期后重新运行对应命令。两位参与者要用不同身份加入同一个 `demo` 房间。上述凭据只用于本地开发。接入自己的应用时，请在[需要登录的后端签发令牌](sdk.zh-Hans.md#用-nodejs-签发令牌和查询房间)，只把 WebSocket 地址和参与者令牌发给客户端。

## 创建 Flutter 应用

安装 [Flutter SDK](https://docs.flutter.dev/install) 3.38 或更高版本，使用 Dart 3.10 或更高版本，并准备 Chrome 用于第一次运行。创建项目并添加 SDK：

```sh
flutter doctor
flutter create --platforms=web,android,ios flutter_call
cd flutter_call
flutter pub add livekit_client:2.13.2
```

下载 [main.dart](../examples/main.dart)，用它替换 `lib/main.dart`。在 Chrome 运行应用：

```sh
flutter run -d chrome --web-hostname 127.0.0.1 --web-port 8080
```

## 加入房间并验证音视频

1. **Server URL** 保留 `ws://127.0.0.1:7880`，粘贴 `flutter-alice` 的令牌，点击 **Join**。用浏览器示例作为 Bob 加入同一房间。
2. 在 Flutter 应用点击 **Publish camera and microphone** 并允许浏览器访问设备。Bob 应该能看到并听到 Alice。
3. 开启 Bob 的摄像头和麦克风，确认 Flutter 能显示 Bob 的视频并播放音频。浏览器阻止自动播放时，点击 Flutter 的 **Play audio**，并检查标签页是否被静音。如果两个标签页共用设备，使用耳机或轮流发布。
4. 在两端点击 **Leave**，再到 Flutter 终端按 `q` 退出。

应用在连接前注册监听器。收到 `TrackSubscribedEvent` 后用 `VideoTrackRenderer` 渲染视频，取消订阅后移除对应画面，音频由 SDK 播放。

## 在 Android 或 iOS 上运行同一应用

- **Android** — 在 `android/app/src/main/AndroidManifest.xml` 添加 `INTERNET`、`CAMERA` 和 `RECORD_AUDIO` 权限。本地模拟器测试时，将 [Android 教程](sdk-android.zh-Hans.md#创建-kotlin-项目)的调试明文配置合并到 `android/app/src/debug/AndroidManifest.xml`。在应用里使用 `ws://10.0.2.2:7880`，并在请求采集时授予两项权限。
- **iOS** — 把 [iOS 权限和本地网络配置](sdk-ios.zh-Hans.md#创建-swiftui-应用)加到 `ios/Runner/Info.plist`。模拟器没有摄像头时，可先验证接收。Android 和 iOS 真机测试均应使用可达、证书受信的 `wss://` 地址，并使用该部署签发的令牌。

执行 `flutter devices` 查看设备 ID，再执行 `flutter run -d DEVICE_ID`，重复两位参与者的收发检查。

[LiveKit Flutter SDK 参考](https://pub.dev/packages/livekit_client)
