#!/usr/bin/env python3
"""Publish bounded demo joint positions; this node never commands actuators."""
import math
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState


class JointDemo(Node):
    def __init__(self):
        super().__init__("joint_demo")
        self.publisher = self.create_publisher(JointState, "/joint_states", 10)
        self.started = self.get_clock().now()
        self.timer = self.create_timer(0.05, self.publish_state)

    def publish_state(self):
        now = self.get_clock().now()
        elapsed = (now - self.started).nanoseconds / 1e9
        message = JointState()
        message.header.stamp = now.to_msg()
        message.name = ["left_wheel_joint", "right_wheel_joint", "shoulder_joint", "elbow_joint"]
        message.position = [0.0, 0.0, 0.28 + 0.2 * math.sin(elapsed * 0.7), 0.9 + 0.25 * math.sin(elapsed * 0.7 + 0.5)]
        self.publisher.publish(message)


def main():
    rclpy.init()
    node = JointDemo()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()