import { starterUrdf } from "./robot";
import { milestones } from "./game";

export type Progress = {
  version: 1;
  completed: string[];
  snippets: Record<string, string>;
};
export const initialProgress: Progress = {
  version: 1,
  completed: [],
  snippets: {
    urdf: starterUrdf,
    python:
      'import rclpy\nfrom rclpy.node import Node\n\nclass RoverNode(Node):\n    def __init__(self):\n        super().__init__("rover_node")\n        self.get_logger().info("Rover online")\n\ndef main():\n    rclpy.init()\n    node = RoverNode()\n    try:\n        rclpy.spin(node)\n    finally:\n        node.destroy_node()\n        rclpy.shutdown()\n',
    cpp: '#include <rclcpp/rclcpp.hpp>\n\nint main(int argc, char **argv) {\n  rclcpp::init(argc, argv);\n  auto node = std::make_shared<rclcpp::Node>("rover_node");\n  RCLCPP_INFO(node->get_logger(), "Rover online");\n  rclcpp::spin(node);\n  rclcpp::shutdown();\n  return 0;\n}\n',
    launch:
      'from launch import LaunchDescription\nfrom launch_ros.actions import Node\n\ndef generate_launch_description():\n    return LaunchDescription([\n        Node(package="roboquest_description",\n             executable="joint_demo.py",\n             name="joint_demo", output="screen"),\n    ])\n',
  },
};
export const STORAGE_KEY = "roboquest.progress.v1";
export function parseProgress(value: unknown): Progress {
  if (!value || typeof value !== "object")
    return structuredClone(initialProgress);
  const candidate = value as Partial<Progress>;
  const completed = Array.isArray(candidate.completed)
    ? candidate.completed.filter(
        (item): item is string =>
          typeof item === "string" && milestones.includes(item),
      )
    : [];
  const snippets = { ...initialProgress.snippets };
  if (candidate.snippets && typeof candidate.snippets === "object")
    for (const key of Object.keys(snippets)) {
      const code = candidate.snippets[key];
      if (typeof code === "string" && code.length <= 100_000)
        snippets[key] = code;
    }
  return { version: 1, completed: [...new Set(completed)], snippets };
}
