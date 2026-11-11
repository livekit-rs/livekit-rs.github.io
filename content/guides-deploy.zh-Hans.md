# 单机部署

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
