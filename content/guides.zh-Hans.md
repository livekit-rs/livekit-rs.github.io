# 从零开始使用 livekit-rs

先在本机启动 Rust 服务，再用两个浏览器标签页完成第一次通话。跟着步骤操作即可，无需注册 LiveKit 账号，也无需事先了解 LiveKit。

## 会用到什么

**房间**是通话发生的地方。每个**参与者**用独立的身份加入房间。一条**媒体轨道**承载一路麦克风、摄像头或屏幕画面。服务器把发布的轨道转发给订阅它的参与者。

| 工具 | 用途 |
| --- | --- |
| `livekit-server` | 在你的电脑上运行 Rust 服务。 |
| `lk` | 创建房间、查询参与者、生成本地测试令牌。 |
| 客户端 SDK | 让应用加入房间、收发音视频。 |
| 服务端 SDK | 让后端签发入房令牌、调用管理 API。 |

## 本地构建与启动

安装 [Git](https://git-scm.com/install)、[Rust 工具链](https://rustup.rs/)和系统链接器。macOS 可安装 Xcode Command Line Tools，Linux 可安装发行版提供的 C 构建工具。在终端运行：

```sh
git clone https://github.com/livekit-rs/livekit-rs.git
cd livekit-rs
cargo build --locked --release -p livecloud --bin livekit-server
./target/release/livekit-server --dev --bind 127.0.0.1
```

仓库会选择所需的 Rust 工具链。首次构建需要下载依赖，可能耗时几分钟。保持服务运行，再打开一个终端检查 HTTP 端口：

```sh
curl --fail http://127.0.0.1:7880/
```

看到 `OK` 即可继续。如果端口已被占用，可停止占用端口的服务，或在启动命令末尾加上 `--port 17880 --rtc.tcp_port 17881 --udp-port 17882`。之后的 HTTP 和 WebSocket 地址都要改用新的服务端口。

开发模式使用公开测试凭据 `devkey` 和 `secret`，仅用于本机练习。

## 用 LiveKit SDK 接入

1. 按 [CLI 指南](cli.zh-Hans.md)安装 `lk`，创建 `demo` 房间，为 Alice 和 Bob 分别签发令牌。
2. 按 [SDK 指南](sdk.zh-Hans.md)用两个浏览器标签页加入同一房间，从一个标签页发布视频，在另一个标签页接收。
3. 测试完成后退出两个标签页，在终端按 Ctrl+C 停止服务。SDK 指南还演示了如何用 Node.js 后端签发令牌和查询房间。

## 单机部署

将[单机配置模板](../examples/standalone.yaml)复制到 `/etc/livekit/config.yaml`。将程序安装到 `/usr/local/bin/livekit-server` 并生成部署凭据。

```sh
/usr/local/bin/livekit-server generate-keys
/usr/local/bin/livekit-server --config /etc/livekit/config.yaml ports
/usr/local/bin/livekit-server --config /etc/livekit/config.yaml
```

启动前，将生成的凭据写入 `/etc/livekit/keys.yaml`，格式为 API Key 到 Secret 的 YAML 映射。将文件权限设为 `0600`，确保专用服务用户可读。配置和密钥应保存在服务端。

模板的 HTTP 和 WebSocket 只绑定回环地址。使用同机反向代理处理 HTTPS 和 WSS，并启用 WebSocket 升级。媒体和 TURN 端口需要单独放行。如需原生 TLS，参考 [HTTPS/WSS 配置](../examples/native-tls.md)加载证书链和私钥。

| 模板端口 | 协议与用途 |
| --- | --- |
| 7880 | TCP，HTTP、WebSocket 和 Server API。默认经同机代理接入。 |
| 7881 | TCP，ICE 回退。 |
| 7882 | UDP，复用 WebRTC 媒体。 |
| 3478 | UDP，内置 TURN。 |
| 30000–30100 | UDP，TURN relay 分配。 |

NAT 后的节点应通过 `rtc.node_ip` 广播真实可达的外部地址，并配置端口转发。验证 STUN 发现和候选地址可达后，再使用 `rtc.use_external_ip`。从服务端网络外发起真实 SDK 通话验证。 `ports` 仅输出配置端口。

使用 systemd 时可参考[服务模板](../examples/livecloud.service)。将 `ExecStart` 调整为实际程序路径，创建服务账号后再启动。退出时为房间排空留出时间。进程重启后，客户端需要重建内存中的会话。

## CLI 和配置

```sh
livekit-server --help
livekit-server help-verbose
livekit-server --version
livekit-server --config /etc/livekit/config.yaml ports
```

根命令接受 LiveKit 风格的 YAML、参数和环境变量。非空的 `--config-body` 或 `LIVEKIT_CONFIG` 优先于配置文件。通过 `help-verbose` 查看字段级参数，并在计划部署的构建上测试实际配置。根命令和部分子命令对生成参数的处理有所不同。

## 验证迁移

对照期间固定客户端和服务端 SDK 版本。实测房间创建、令牌授权、发布订阅、数据消息、重连和业务实际使用的 Server API 与 Webhook。覆盖本地回环与部署环境的真实网络路径。保留上一版程序和配置以便回滚，所需场景在候选版本通过后再切换流量。

## 排查通话问题

- **连接被拒绝** — 检查进程、反向代理转发和 WebSocket 升级。
- **鉴权失败** — 检查 API Key、令牌过期时间、房间授权、身份和机器时钟。
- **连接成功但无媒体** — 检查浏览器权限、实际选中的 ICE 候选对，以及客户端到公网 UDP 和 TURN 的连通性。
- **偶发卡顿** — 使用同步时间戳采集客户端 WebRTC 统计与服务端日志。记录编码、实际传输路径、RTT、丢包和重连事件。
- **配置导致启动失败** — 从单机模板开始逐项启用配置，并在实际构建上验证参数。
