# 用 Android 完成第一次通话

## 启动 livekit-rs 并获取两个令牌

按[快速开始](guides.zh-Hans.md)用开发模式启动 livekit-rs。在另一个已安装[官方 CLI](cli.zh-Hans.md) 的终端运行：

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room create --empty-timeout 600 demo
lk token create --join --room demo --identity android-alice --valid-for 10m
lk token create --join --room demo --identity browser-bob --valid-for 10m
```

复制每条命令输出中 `Access token:` 后的 JWT。新应用使用 `android-alice`，[浏览器示例](sdk.zh-Hans.md#用两个浏览器标签页完成第一次通话)使用 `browser-bob`。令牌过期后重新运行对应命令。两位参与者要用不同身份加入同一个 `demo` 房间。上述凭据只用于本地开发。接入自己的应用时，请在[需要登录的后端签发令牌](sdk.zh-Hans.md#用-nodejs-签发令牌和查询房间)，只把 WebSocket 地址和参与者令牌发给客户端。

## 创建 Kotlin 项目

在 Android Studio 选择 **New Project → Empty Views Activity**，语言选 Kotlin，包名填 `com.example.livekitcall`，最低 SDK 选 24 或更高。本地示例使用 JDK 17，编译 SDK 和目标 SDK 均设为 36。SDK 的音频路由依赖来自 JitPack。在根目录 `settings.gradle.kts` 的 `dependencyResolutionManagement { repositories { … } }` 内加入：

```kotlin
maven("https://jitpack.io") {
    content { includeGroup("com.github.davidliu") }
}
```

在 `app/build.gradle.kts` 的 `dependencies` 内添加：

```kotlin
implementation("io.livekit:livekit-android:2.30.0")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.4")
```

同一文件中的 Java 和 Kotlin 都要使用 JVM 17。如果模板已设置这两个目标，修改原有配置即可。同步 Gradle 后，在 `app/src/main/AndroidManifest.xml` 的 `<manifest>` 下、`<application>` 外添加权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

本地模拟器使用 `ws://` 时，创建 `app/src/debug/AndroidManifest.xml`。以下设置只作用于调试版本：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true" />
</manifest>
```

用下载的 [MainActivity.kt](../examples/MainActivity.kt) 替换模板生成的同名文件。文件里的包名要与应用命名空间一致。

## 在模拟器中验证音视频

1. 在 Device Manager 创建模拟器，把摄像头配置为主机摄像头或虚拟场景，运行调试应用。Android 地址填 `ws://10.0.2.2:7880`，这是模拟器访问宿主机的地址。宿主机上的 Bob 浏览器仍用普通回环地址。
2. 将 `android-alice` 的令牌粘贴到 **Room token**，点击 **Join**。用浏览器示例作为 Bob 入房并先发布。Android 应该能显示 Bob 的视频并自动播放音频。测试模拟器采集时，在模拟器设置中启用麦克风输入。
3. 在 Android 点击 **Publish camera and microphone** 并授予两项运行时权限。Bob 应该能看到并听到 Android 参与者。建议使用耳机。如果两个客户端共用设备，可以先关闭浏览器采集。
4. 两端都点击 **Leave** 退出房间。

应用在连接前开始监听 `TrackSubscribed`。SDK 自动订阅轨道并播放远端音频，应用把收到的视频交给 `SurfaceViewRenderer`，取消订阅后移除渲染器。用真机测试时，填写部署环境的 `wss://` 地址，并用该部署的凭据签发两个令牌。模拟器地址仅在 Android 模拟器内有效。

[LiveKit Android SDK 参考](https://github.com/livekit/client-sdk-android)
