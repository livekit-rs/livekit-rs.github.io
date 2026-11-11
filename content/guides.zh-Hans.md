# 使用指南

构建、接入和运维一个 livekit-rs 节点。

## 本地构建与启动

使用 rustup 安装 Rust，并在源码根目录执行命令。工具链文件固定 Rust 1.99.0，构建依赖由锁文件固定。

```sh
cargo build --locked --release -p livecloud --bin livekit-server
./target/release/livekit-server --dev --bind 127.0.0.1
```

在另一个终端检查就绪状态并生成令牌。每位参与者需要不同的 identity。

```sh
curl --fail http://127.0.0.1:7880/
./target/release/livekit-server --dev create-join-token --room demo --identity alice
```

未配置密钥时，开发模式使用公开的测试凭据 `devkey` 和 `secret`。开发令牌仅供本机实例使用。

## 使用 LiveKit SDK 接入

本地开发使用 `ws://127.0.0.1:7880`，部署时使用受 HTTPS 保护的 `wss://` 地址。在可信后端签发入房令牌，按需授权，并将 API Secret 保留在后端。以下 Node.js 示例为一个房间签发短期令牌。后端应根据已鉴权的请求确定房间和用户身份。

```ts
import { AccessToken } from 'livekit-server-sdk';

const key = process.env.LIVEKIT_API_KEY;
const secret = process.env.LIVEKIT_API_SECRET;
if (!key || !secret) throw new Error('Missing LiveKit credentials');

const token = new AccessToken(key, secret, { identity: 'alice', ttl: '10m' });
token.addGrant({ roomJoin: true, room: 'demo', canPublish: true, canSubscribe: true });
const jwt = await token.toJwt();
```

将令牌返回客户端，然后接入房间并播放订阅的媒体轨道。

```ts
import { Room, RoomEvent } from 'livekit-client';

const room = new Room({ adaptiveStream: true, dynacast: true });
room.on(RoomEvent.TrackSubscribed, (track) => {
  document.body.append(track.attach());
});
await room.connect(serverUrl, jwt);
await room.localParticipant.enableCameraAndMicrophone();
```

摄像头和麦克风需要浏览器授权和安全上下文。使用两个身份验证双向发布和订阅。SDK 兼容性取决于具体工作流，迁移前请查看[对照结果](compatibility.zh-Hans.md)。

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
