#!/usr/bin/env python3
"""Observe an actual TF2 lookup without blocking the single-threaded executor."""
import rclpy
from rclpy.node import Node
from rclpy.time import Time
from tf2_ros import Buffer, TransformException, TransformListener


class ToolProbe(Node):
    def __init__(self):
        super().__init__("tool_probe")
        self.buffer = Buffer()
        self.listener = TransformListener(self.buffer, self)
        self.timer = self.create_timer(2.0, self.inspect)

    def inspect(self):
        try:
            transform = self.buffer.lookup_transform("base_link", "tool0", Time())
            translation = transform.transform.translation
            self.get_logger().info(f"tool0 in base_link: ({translation.x:.3f}, {translation.y:.3f}, {translation.z:.3f}) m")
        except TransformException as error:
            self.get_logger().warning(f"Waiting for connected, timestamped TF: {error}")


def main():
    rclpy.init()
    node = ToolProbe()
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