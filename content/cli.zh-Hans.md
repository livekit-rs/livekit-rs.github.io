# 使用 LiveKit CLI

官方 LiveKit CLI 的命令名是 `lk`。它可以在本地 livekit-rs 上创建房间、查看参与者并生成入房令牌。Rust 服务端的命令名是 `livekit-server`，用于启动服务和查看配置。

## 安装并连接

安装[官方 LiveKit CLI](https://docs.livekit.io/reference/developer-tools/livekit-cli/)。macOS 使用 Homebrew 时运行：

```sh
brew install livekit-cli
lk --version
```

按[快速开始](guides-build-locally.zh-Hans.md)启动 Rust 服务。在第二个终端配置本地开发凭据。CLI 调用 API 时使用 HTTP 地址，浏览器入房时使用 WebSocket 地址。

```sh
export LIVEKIT_URL=http://127.0.0.1:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=secret
lk room list
```

刚启动时房间列表为空是正常的。新开的终端需要重新执行这三条 `export`。对接已部署的服务时，使用它的 HTTPS API 地址和对应凭据。

## 创建房间并查看参与者

```sh
lk room create --empty-timeout 600 demo
lk room list
lk room participants list demo
```

房间会出现在列表里。有人加入之前，参与者列表为空。房间过期后可以重新创建。按[浏览器 SDK 示例](sdk.zh-Hans.md)入房后，再执行最后一条命令就能看到已连接的身份。

## 为每位参与者生成令牌

```sh
lk token create --join --room demo --identity alice --valid-for 10m
lk token create --join --room demo --identity bob --valid-for 10m
```

分别复制输出中 `Access token:` 后面的 JWT。两个浏览器标签页各用一个令牌，加入同一个房间。每个令牌授权对应身份进入指定房间，过期后重新生成。请避免把令牌和 API 密钥写入日志或提交到源码仓库。

## 清理和查看帮助

```sh
lk room delete demo
lk room --help
lk token create --help
./target/release/livekit-server --help
```

删除房间会断开其中的参与者。如果演示房间已经关闭，可以省略删除命令。更多房间与参与者操作见 [CLI 命令参考](https://docs.livekit.io/reference/developer-tools/livekit-cli/rooms/)，公开验证覆盖的服务端行为见[兼容性说明](compatibility.zh-Hans.md)。
