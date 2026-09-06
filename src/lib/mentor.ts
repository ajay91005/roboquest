import type { Validation } from "./validate-urdf";

const topicHints: [RegExp, string][] = [
  [
    /pid|gain|overshoot|windup|controller/i,
    "KP responds to today's error, KI removes persistent error, and KD reacts to changes in measured speed. In the Control lab, start with KP = 2 and slowly raise KI. Can you reach less than 5% final error without exceeding 10% overshoot?",
  ],
  [
    /motor|battery|voltage|current|wire|estop|e-stop/i,
    "Size the power rail for simultaneous loads and stall current, not just idle current. Match logic levels, protect wiring, and use a physical e-stop that removes actuator energy independently of software. Which failure would still be dangerous if ROS stopped responding?",
  ],
  [
    /nav2|slam|map|localization/i,
    "SLAM estimates a map and robot pose. Localization estimates pose in an existing map. Nav2 uses that pose, a footprint and costmaps to navigate. Before planning a route, can you verify a consistent map -> odom -> base transform chain?",
  ],
  [
    /ekf|covariance|fusion/i,
    "An EKF combines supported state measurements using their uncertainty. robot_localization does not directly fuse raw LaserScan: use a scan-matcher pose or odometry with covariance. Are your measurements independent, timestamped correctly and expressed in known frames?",
  ],
  [
    /moveit|inverse kinematics|planning/i,
    "MoveIt plans for the robot's actual joints and collision geometry. Rover's two-joint arm cannot reach arbitrary six-dimensional poses. Start with a reachable joint-space goal. What orientation constraints can this arm physically satisfy?",
  ],
  [
    /topic|service|action|qos/i,
    "Topics carry streams, services handle bounded requests, and actions support long tasks with feedback and cancellation. QoS must be compatible between publisher and subscriber. Does your task need a stream of data, a quick reply, or ongoing feedback?",
  ],
  [
    /python|c\+\+|execute|run code/i,
    "The browser edits and exports source; it does not execute Python, C++ or ROS nodes. The included native Humble workspace runs them on your computer. For your next step, export the source and follow the local ROS guide.",
  ],
];
export function localHint(
  validation: Validation,
  level: number,
  question = "",
): string {
  const failure = validation.checks.find((check) => !check.passed);
  const topic = topicHints.find(([pattern]) => pattern.test(question));
  if (topic) return topic[1];
  if (/tf2|transform|frame/i.test(question) && !failure)
    return "TF2 tracks relationships between coordinate frames over time. robot_state_publisher uses your URDF and /joint_states to compute those relationships. Fixed joints appear on /tf_static. Which transform would you inspect to verify the end effector relative to base_link?";
  if (!failure)
    return "All structural quest checks pass. Now move the shoulder and elbow: tool0 should follow the forearm. In native ROS, verify with `ros2 run tf2_ros tf2_echo base_link tool0`. What would change if the joint origin were expressed in the world frame instead of the parent frame?";
  if (failure.id === "tool")
    return [
      "Your robot is connected, but a connected tree is not always the correct kinematic chain. Think about the gripper: which link should it move with when the elbow bends? Inspect the parent of tool_joint.",
      "Find tool_joint near the end of the file. A parent of base_link bypasses both arm joints. The tool should be attached to forearm using a fixed joint and a 0.28 m local Z offset. In whose coordinate frame is that offset measured?",
      'Inside tool_joint, use <parent link="forearm"/> and keep <child link="tool0"/> with <origin xyz="0 0 0.28"/>. This is a fixed transform from the forearm tip. Build again, then move the elbow to test your hypothesis.',
    ][Math.min(Math.max(level, 1), 3) - 1];
  return level <= 1
    ? `Let's focus on one issue: ${failure.label.toLowerCase()}. What part of your description controls that property?`
    : `${failure.detail} Fix that first, then build again so we can isolate the next issue.`;
}
