# CLI and configuration

```sh
livekit-server --help
livekit-server help-verbose
livekit-server --version
livekit-server --config /etc/livekit/config.yaml ports
```

The root command accepts LiveKit-style YAML, flags, and environment variables. A nonempty `--config-body` or `LIVEKIT_CONFIG` takes precedence over a file. Inspect `help-verbose` for field-level flags and test the exact configuration before deploying. Generated flag behavior differs between the root command and some subcommands.
