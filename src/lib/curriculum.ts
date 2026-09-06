export type Phase = {
  id: string;
  number: string;
  title: string;
  short: string;
  subtitle: string;
  topics: { title: string; body: string; lab: string }[];
  question: string;
  answers: string[];
  correct: number;
};

export const curriculum: Phase[] = [
  {
    id: "mechanics",
    number: "01",
    title: "Mechanics & modeling",
    short: "Mechanics",
    subtitle: "Give your robot a body.",
    topics: [
      {
        title: "Design before you drive",
        body: "Start with payload, reach, wheel radius, track width and a mass budget. Keep the projected center of mass inside the support polygon, including at maximum arm extension. Torque must overcome gravity and acceleration; use a safety factor and account for gearbox efficiency.",
        lab: "Sketch a 0.62 m chassis. Estimate the tipping moment with a 0.5 kg payload at 0.4 m reach.",
      },
      {
        title: "CAD to a robot description",
        body: "In FreeCAD or SolidWorks, create separate rigid link bodies, set joint coordinate systems, simplify visual meshes and create convex collision geometry. Export STL/DAE in metres and check scale. CAD mass properties provide mass, center of mass and inertia tensors. Never use a zero inertia for a moving body.",
        lab: "Export one link and record its mass and inertia. Keep mesh URIs package-relative for native ROS.",
      },
      {
        title: "URDF, XACRO & TF2",
        body: "URDF describes links and joints as a tree. Joint origins are transforms in the parent frame; the axis is in the joint frame. XACRO adds macros and properties, but must expand into URDF. robot_state_publisher combines URDF with /joint_states to publish /tf; fixed joints go to /tf_static. The browser previews these transforms, not a DDS runtime.",
        lab: "Complete the live garage quest: attach tool0 to forearm at (0, 0, 0.28). Move the elbow and verify the tool follows.",
      },
      {
        title: "Kinematics & verification",
        body: "Compose homogeneous transforms from the base to the end effector for forward kinematics. Right-handed ROS frames conventionally use X forward, Y left, Z up. Visual, collision and inertial origins can differ. A renderable description is not yet a dynamically valid Gazebo model.",
        lab: "Explain why connecting tool0 directly to base_link yields a valid tree but the wrong kinematic chain.",
      },
    ],
    question:
      "A tool must move with the forearm. Which frame should parent its fixed joint?",
    answers: ["base_link", "forearm", "map"],
    correct: 1,
  },
  {
    id: "electronics",
    number: "02",
    title: "Electronics & hardware",
    short: "Electronics",
    subtitle: "Power it. Connect it. Protect it.",
    topics: [
      {
        title: "Power architecture",
        body: "Separate motor and logic power rails with appropriately rated DC/DC converters. Size wiring and fuses for stall current. Include reverse-polarity protection, bulk decoupling, a battery management system and a hardware emergency stop that removes actuator energy independently of software.",
        lab: "Draw a fused battery-to-motor rail and a separate regulated logic rail. Calculate worst-case current.",
      },
      {
        title: "Logic & motor drivers",
        body: "ESP32 typically uses 3.3 V logic; STM32 pin tolerance depends on the exact part and pin. Never assume 5 V tolerance. H-bridges control brushed DC motors using PWM and direction. Match continuous/peak current ratings, heat dissipation and encoder voltage levels.",
        lab: "Select a driver using motor stall current and document level-shifter requirements.",
      },
      {
        title: "I2C, SPI, UART & CAN",
        body: "I2C uses addressed devices and pull-ups for short board-level links. SPI uses separate chip-select lines and fast synchronous transfer. UART is asynchronous and needs matched baud rates. CAN is a differential multi-master bus with arbitration, termination at both ends and robust error handling.",
        lab: "Choose a bus for an IMU, display and distributed motor controllers. Explain each choice and termination.",
      },
      {
        title: "KiCad schematic to PCB",
        body: "Create hierarchical power, MCU, sensing and driver sheets. Assign footprints, run ERC, then lay out current loops, return paths and decoupling close to pins. Separate noisy switching nodes from sensors. Run DRC, inspect Gerbers and create a BOM and bring-up test plan.",
        lab: "Design a protected encoder interface and add test points for ground, power, PWM and fault outputs.",
      },
    ],
    question: "What must a robot emergency stop do even if ROS crashes?",
    answers: [
      "Publish a zero velocity topic",
      "Restart the MCU",
      "Independently remove actuator energy",
    ],
    correct: 2,
  },
  {
    id: "control",
    number: "03",
    title: "Math & low-level control",
    short: "Low-level control",
    subtitle: "Turn commands into predictable motion.",
    topics: [
      {
        title: "PID & sampling",
        body: "A PID controller uses u = Kp e + Ki integral(e) + Kd de/dt. Implement fixed-rate sampling, output saturation, integral anti-windup and filtered derivatives. Tune the inner wheel-velocity loops before tuning position or navigation behavior.",
        lab: "Use the control lab to compare proportional gains. Predict rise time and steady-state error before running.",
      },
      {
        title: "Differential-drive kinematics",
        body: "For wheel radius r and track b: v = r(wR + wL)/2 and yaw rate = r(wR - wL)/b. The inverse maps body velocity to wheel speeds. Wheel angular velocity is radians per second, not RPM.",
        lab: "For r=0.15 m and b=0.52 m, calculate wheel speeds for v=0.3 m/s and zero yaw rate.",
      },
      {
        title: "Odometry & uncertainty",
        body: "Convert encoder ticks to wheel distances, average for forward travel and divide their difference by track width for heading change. Integrate using the midpoint heading. Slip, quantization and calibration errors accumulate; odometry is locally continuous but globally drifts.",
        lab: "Drive a square and compare final pose with the starting pose. State what encoders cannot observe.",
      },
      {
        title: "Signals & numerical models",
        body: "A browser plot can model a first-order motor and discrete controller in the spirit of MATLAB/Simulink, but is not those products or a calibrated plant. Evaluate settling time, overshoot, saturation and sensitivity to timestep before applying gains to hardware.",
        lab: "Use a low-voltage, current-limited bench test with wheels lifted before closed-loop floor tests.",
      },
    ],
    question: "Why is integral anti-windup needed?",
    answers: [
      "To prevent accumulated error while the actuator saturates",
      "To remove the need for feedback",
      "To increase wheel radius",
    ],
    correct: 0,
  },
  {
    id: "ros",
    number: "04",
    title: "ROS 2 Humble foundations",
    short: "ROS 2 middleware",
    subtitle: "Build the robot's nervous system.",
    topics: [
      {
        title: "Workspaces, colcon & packages",
        body: "Humble targets Ubuntu 22.04. Source /opt/ros/humble/setup.bash, create a workspace with src, resolve dependencies with rosdep, build with colcon, then source install/setup.bash. Use ament_python for Python and ament_cmake for C++ packages.",
        lab: "Create one rclpy node and one rclcpp node in separate packages. Build only your package with --packages-select.",
      },
      {
        title: "Nodes, topics & QoS",
        body: "Nodes encapsulate responsibilities. Topics stream typed messages through DDS. Publishers and subscribers need compatible QoS, including reliability and durability. Use ros2 node list, topic list, topic info --verbose and topic echo to diagnose discovery and data flow.",
        lab: "Publish sensor_msgs/JointState at 20 Hz and inspect names, positions and header timestamps.",
      },
      {
        title: "Services, actions & interfaces",
        body: "Services are bounded request/response operations. Actions support feedback, cancellation and results for long-running tasks. Define custom msg/srv/action types in an interface package using rosidl generators; keep interface packages separate from Python node packages.",
        lab: "Design a gripper service and a pick-and-place action. State how cancellation makes the robot safe.",
      },
      {
        title: "Parameters, launch & lifecycle",
        body: "Declare and validate node parameters. Python launch files compose nodes, namespaces, remappings and parameter YAML. Lifecycle nodes expose explicit configuration and activation states. Executors and callback groups control concurrency; blocking a callback can starve the system.",
        lab: "Create a launch file with a wheel-radius parameter, then reject a negative runtime update.",
      },
    ],
    question:
      "Which ROS primitive fits a cancellable 30-second navigation goal?",
    answers: ["Parameter", "Action", "One-way topic only"],
    correct: 1,
  },
  {
    id: "integration",
    number: "05",
    title: "Robot integration",
    short: "Robot integration",
    subtitle: "Connect software to real hardware.",
    topics: [
      {
        title: "TF2 frame ownership",
        body: "A common mobile robot tree is map -> odom -> base_footprint -> base_link. Localization owns map -> odom; odometry owns odom -> base_footprint; robot_state_publisher owns body joints. Each transform needs one authority, consistent timestamps and a connected tree.",
        lab: "Run tf2_echo base_link tool0 and view_frames. Diagnose duplicate broadcasters and extrapolation errors.",
      },
      {
        title: "ros2_control hardware interfaces",
        body: "Implement a SystemInterface with lifecycle methods and read/write loops. Export state and command interfaces that match URDF declarations. A controller_manager loads joint_state_broadcaster and diff_drive_controller. The control loop must not block on network calls.",
        lab: "Begin with mock components, then map encoder feedback and velocity commands to the motor driver.",
      },
      {
        title: "micro-ROS on MCUs",
        body: "micro-ROS uses rclc on constrained devices and an agent bridging XRCE-DDS to ROS 2. Select serial or UDP transport, budget memory and configure executor timing. It does not turn an ESP32 into a full Linux ROS host.",
        lab: "Publish encoder counts from the MCU through the agent. Test reconnection and time synchronization.",
      },
      {
        title: "Fault handling & bring-up",
        body: "Use command watchdogs, velocity limits, diagnostics and explicit fault states. Loss of host communication should stop motion locally. Test each subsystem before full bring-up, record rosbag data and preserve reproducible firmware and calibration versions.",
        lab: "Disconnect the bridge and verify that the MCU independently times out motor commands.",
      },
    ],
    question: "Who normally publishes transforms for the robot's URDF joints?",
    answers: ["Nav2 costmap", "The CAN transceiver", "robot_state_publisher"],
    correct: 2,
  },
  {
    id: "autonomy",
    number: "06",
    title: "High-level autonomy",
    short: "High-level autonomy",
    subtitle: "From moving robot to autonomous system.",
    topics: [
      {
        title: "Sensor fusion & EKF",
        body: "An EKF propagates state and covariance through a motion model, then updates them from measurements and their uncertainty. robot_localization can fuse wheel odometry and IMU. LiDAR usually contributes a pose/odometry estimate from scan matching, not raw LaserScan input to the EKF. Avoid fusing correlated information twice.",
        lab: "Set frame IDs, sensor covariances and a 2D fusion configuration; inspect innovation and heading drift.",
      },
      {
        title: "SLAM with slam_toolbox",
        body: "SLAM estimates trajectory and map together. slam_toolbox uses laser scans, odometry and a valid TF tree with consistent time. Loop closures reduce accumulated drift. Save both occupancy maps and pose graphs when needed; mapping and localization are different operating modes.",
        lab: "Map a closed loop, save the map, restart in localization mode and measure pose repeatability.",
      },
      {
        title: "Nav2 behavior & planning",
        body: "Nav2 combines localization, global planning, local control and behavior-tree orchestration. Costmap layers represent static obstacles, sensed obstacles and footprint inflation. Tune footprints, tolerances and recovery behaviors before increasing speed; use lifecycle management and action feedback.",
        lab: "Plan around a temporary obstacle and cancel a goal. Compare global and local costmaps.",
      },
      {
        title: "MoveIt 2 & production readiness",
        body: "MoveIt 2 builds planning groups, collision matrices, IK solvers and time-parameterized trajectories. A two-joint teaching arm cannot reach arbitrary 6D poses; use constrained goals or a 6-DOF arm for general manipulation. Coordinate base/arm safety, scene updates and gripper control. Production also requires simulation regression, bags, CI, latency budgets, security and hardware safety reviews.",
        lab: "Define a reachable joint-space goal, add a collision object, and verify the planned path before hardware execution.",
      },
    ],
    question:
      "What should robot_localization receive from a LiDAR scan matcher?",
    answers: [
      "A pose or odometry estimate with covariance",
      "Raw mesh triangles",
      "A motor PWM duty cycle",
    ],
    correct: 0,
  },
];
