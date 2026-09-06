"""The public rosbridge allowlist, testable without ROS or networking packages."""
import json

TOPICS = {"/joint_states": "sensor_msgs/JointState", "/tf": "tf2_msgs/TFMessage", "/tf_static": "tf2_msgs/TFMessage"}


def filter_operation(raw):
    """Reconstruct subscriptions, discarding untrusted options and arbitrary IDs."""
    message = json.loads(raw)
    if not isinstance(message, dict):
        raise ValueError("Expected an object")
    operation = message.get("op")
    topic = message.get("topic")
    if operation not in ("subscribe", "unsubscribe") or not isinstance(topic, str) or topic not in TOPICS:
        raise ValueError("Read-only telemetry: operation or topic denied")
    result = {"op": operation, "topic": topic, "id": "roboquest:" + topic}
    if operation == "subscribe":
        result.update({"type": TOPICS[topic], "throttle_rate": 100, "queue_length": 1})
    return result