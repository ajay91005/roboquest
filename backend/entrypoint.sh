#!/usr/bin/env bash
set -eo pipefail
source /opt/ros/humble/setup.bash
source /home/rover/ws/install/setup.bash

ros2 launch roboquest_description preview.launch.py &
preview_pid=$!
ros2 launch rosbridge_server rosbridge_websocket_launch.xml address:=127.0.0.1 port:=9090 &
bridge_pid=$!
python3 /home/rover/app/gateway.py &
gateway_pid=$!
trap 'kill "$preview_pid" "$bridge_pid" "$gateway_pid" 2>/dev/null || true' EXIT INT TERM
wait -n "$preview_pid" "$bridge_pid" "$gateway_pid"