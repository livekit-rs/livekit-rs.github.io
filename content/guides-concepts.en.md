# What you will use

A **room** is where people meet. A **participant** joins the room with a unique identity. A **track** carries one microphone, camera, or screen stream. The server forwards published tracks to participants that subscribe to them.

| Tool | What it does |
| --- | --- |
| `livekit-server` | Runs the Rust server on your computer. |
| `lk` | Creates rooms, lists participants and generates local test tokens. |
| Client SDK | Connects an app to a room and sends or receives media. |
| Server SDK | Signs room tokens and calls management APIs from your backend. |
