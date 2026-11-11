# CLI 和配置

```sh
livekit-server --help
livekit-server help-verbose
livekit-server --version
livekit-server --config /etc/livekit/config.yaml ports
```

根命令接受 LiveKit 风格的 YAML、参数和环境变量。非空的 `--config-body` 或 `LIVEKIT_CONFIG` 优先于配置文件。通过 `help-verbose` 查看字段级参数，并在计划部署的构建上测试实际配置。根命令和部分子命令对生成参数的处理有所不同。
