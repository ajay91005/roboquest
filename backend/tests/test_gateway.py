"""Unit tests for the public gateway's allowlist, independent of ROS packages."""
import json
import unittest
from backend.gateway_policy import filter_operation


class GatewayPolicyTest(unittest.TestCase):
    def test_subscribe_is_reconstructed(self):
        result = filter_operation(json.dumps({"op": "subscribe", "topic": "/joint_states", "throttle_rate": 0, "compression": "png"}))
        self.assertEqual(result["throttle_rate"], 100)
        self.assertNotIn("compression", result)

    def test_mutating_operations_are_denied(self):
        for operation in ["publish", "advertise", "call_service", "set_param"]:
            with self.assertRaises(ValueError):
                filter_operation(json.dumps({"op": operation, "topic": "/joint_states"}))

    def test_unknown_topics_and_invalid_payloads_are_denied(self):
        for raw in ['{"op":"subscribe","topic":"/cmd_vel"}', '[]', '{']:
            with self.assertRaises(ValueError):
                filter_operation(raw)


if __name__ == "__main__":
    unittest.main()