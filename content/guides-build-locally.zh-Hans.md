# 本地构建与启动

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
