# RoboQuest Local ROS Runtime

Optional ROS 2 Humble telemetry for the browser garage. The web game does not
need this runtime. It runs on your own computer and does not require a cloud plan.

From the project root:

```bash
docker build -t roboquest-ros backend
docker run --rm -p 127.0.0.1:7860:7860 \
  -e ALLOWED_ORIGINS=http://localhost:3000 roboquest-ros
```

Connect the local frontend to `ws://localhost:7860`. Match `ALLOWED_ORIGINS` to
the actual frontend origin if you change ports. Rosbridge is bound to container
loopback; only the filtering gateway is exposed.

The container publishes synthetic joint states, robot transforms and a TF2
probe. It is not a physics or autonomy simulator. The gateway reconstructs only
subscriptions to `/joint_states`, `/tf` and `/tf_static`; it rejects publications,
service calls and arbitrary execution. Origin filtering is not authentication.

Do not attach real actuator topics or credentials. Native Docker execution must
be tested on a machine with Docker available. See the full
[deployment guide](../docs/DEPLOYMENT.md) for native Ubuntu and verification.
