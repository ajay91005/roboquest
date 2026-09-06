import { curriculum } from "./curriculum";

export const milestones = [
  "urdf-tf2",
  "pid-lab",
  ...curriculum.map((phase) => phase.id),
];
export const totalXp = 1000;

export function earnedXp(completed: string[]) {
  return [...new Set(completed)].reduce(
    (sum, id) =>
      sum +
      (id === "urdf-tf2"
        ? 250
        : id === "pid-lab"
          ? 150
          : curriculum.some((phase) => phase.id === id)
            ? 100
            : 0),
    0,
  );
}

export function phaseUnlocked(index: number, completed: string[]) {
  if (index === 0) return true;
  if (!completed.includes("urdf-tf2")) return false;
  return curriculum
    .slice(0, index)
    .every((phase) => completed.includes(phase.id));
}

export function phaseRequirement(id: string, completed: string[]) {
  if (id === "mechanics" && !completed.includes("urdf-tf2"))
    return "Repair Rover's tool transform in the garage first.";
  if (id === "control" && !completed.includes("pid-lab"))
    return "Complete the wheel-speed challenge in the Control lab first.";
  return "";
}

export function nextMission(completed: string[]) {
  if (!completed.includes("urdf-tf2")) return "Repair Rover's tool transform";
  const phase = curriculum.find((entry) => !completed.includes(entry.id));
  return phase
    ? `Finish ${phase.title.toLowerCase()}`
    : "Your foundation journey is complete";
}

export type Decision = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
export const decisions: Record<string, Decision[]> = {
  mechanics: [
    {
      question:
        "Rover tips forward when the arm reaches out. What should you check first?",
      options: [
        "Whether the center of mass stays inside the support polygon",
        "The ROS topic names",
        "Whether the mesh has enough polygons",
      ],
      answer: 0,
      explanation:
        "Extending the arm shifts the combined center of mass. Its ground projection must stay inside the support polygon, with margin for acceleration.",
    },
    {
      question:
        "A CAD chassis exported in millimetres appears 1,000 times too large. What is the correct conversion to metres?",
      options: [
        "Multiply each dimension by 1000",
        "Multiply each dimension by 0.001",
        "Change the joint axis",
      ],
      answer: 1,
      explanation:
        "One millimetre is 0.001 metres. Keep CAD, mesh scale and URDF dimensions in consistent units.",
    },
    {
      question:
        "The forearm-to-tool transform is fixed. What happens to base-to-tool when the elbow rotates?",
      options: [
        "It also stays fixed",
        "The TF tree disconnects",
        "It changes because the composed chain contains a moving joint",
      ],
      answer: 2,
      explanation:
        "A fixed local transform can be part of a moving chain. TF2 composes every transform from the base to the tool.",
    },
  ],
  electronics: [
    {
      question:
        "Two motors each draw 4 A at stall. What must the shared motor rail be designed around?",
      options: [
        "Only the idle current",
        "At least the combined 8 A stall demand, with protection and appropriate margin",
        "The ESP32's GPIO current limit",
      ],
      answer: 1,
      explanation:
        "Budget simultaneous loads, wire ampacity, driver heating and protection. A fuse protects wiring; select its time-current behavior deliberately.",
    },
    {
      question:
        "A 5 V encoder feeds a 3.3 V input with no stated 5 V tolerance. Your next step?",
      options: [
        "Connect it directly",
        "Increase the baud rate",
        "Use a suitable level shifter or compatible output interface",
      ],
      answer: 2,
      explanation:
        "Logic thresholds and absolute maximum ratings matter. Never assume a pin is 5 V tolerant.",
    },
    {
      question:
        "Your CAN cable runs through four motor controllers. Where do its termination resistors belong?",
      options: [
        "At the two physical ends of the bus",
        "At every controller",
        "Only on the battery",
      ],
      answer: 0,
      explanation:
        "Terminate the two ends of the transmission line. Extra terminators load the bus; missing ones cause reflections.",
    },
  ],
  control: [
    {
      question:
        "With r=0.15 m and both wheels at 2 rad/s, how fast does Rover move?",
      options: ["0.15 m/s", "0.30 m/s", "0.60 m/s"],
      answer: 1,
      explanation:
        "v = r(wR + wL)/2 = 0.15(2 + 2)/2 = 0.30 m/s. Equal wheel speeds produce no yaw.",
    },
    {
      question:
        "Your motor saturates but the integral keeps increasing. What happens after the error changes sign?",
      options: [
        "The stored integral can keep driving the wrong way",
        "The encoder gains resolution",
        "The controller automatically becomes stable",
      ],
      answer: 0,
      explanation:
        "This is integral windup. Stop or back-calculate integration during saturation so recovery is controlled.",
    },
    {
      question:
        "Wheel odometry says the square route closed, but Rover is off by 20 cm. What is a likely cause?",
      options: [
        "Too many TF frames",
        "A fixed tool joint",
        "Wheel slip or calibration errors accumulating over the route",
      ],
      answer: 2,
      explanation:
        "Encoder odometry is relative and drifts. External measurements can correct drift; topic renaming cannot.",
    },
  ],
  ros: [
    {
      question:
        "You built a package, but ROS cannot find it in a new terminal. What is missing?",
      options: [
        "Source the workspace's install/setup.bash after the ROS installation",
        "Delete package.xml",
        "Change every topic to reliable QoS",
      ],
      answer: 0,
      explanation:
        "Each terminal needs the base environment and workspace overlay. Building does not modify other shells.",
    },
    {
      question:
        "A best-effort sensor publisher cannot satisfy a reliable subscriber. What should you inspect?",
      options: [
        "The CAD export scale",
        "Publisher and subscriber QoS compatibility",
        "The arm payload",
      ],
      answer: 1,
      explanation:
        "A reliable subscriber requires reliability the best-effort publisher does not offer. Choose compatible QoS for the data.",
    },
    {
      question:
        "Which interface fits a gripper operation with a quick request and response?",
      options: ["A launch argument only", "A URDF material", "A service"],
      answer: 2,
      explanation:
        "A bounded request/response fits a service. Long-running cancellable work with feedback usually fits an action.",
    },
  ],
  integration: [
    {
      question: "Two nodes publish odom -> base_footprint. What should you do?",
      options: [
        "Increase their publication rates",
        "Assign one transform authority and disable the other",
        "Add another parent to base_footprint",
      ],
      answer: 1,
      explanation:
        "Each TF child needs a consistent parent and authority. Competing publishers cause jumping or inconsistent transforms.",
    },
    {
      question:
        "A ros2_control write loop waits indefinitely for a network reply. What is the main risk?",
      options: [
        "The deterministic control loop stalls",
        "The model gains another joint",
        "The motor driver becomes more accurate",
      ],
      answer: 0,
      explanation:
        "A control loop needs bounded work. Use nonblocking transport and local watchdogs rather than unbounded waits.",
    },
    {
      question:
        "The host loses Wi-Fi. What should the MCU's motor controller do?",
      options: [
        "Keep the last velocity forever",
        "Wait for a browser to reconnect",
        "Stop safely after a locally enforced command timeout",
      ],
      answer: 2,
      explanation:
        "The MCU must enforce communication-loss safety without depending on the host or cloud.",
    },
  ],
  autonomy: [
    {
      question:
        "Which LiDAR-derived signal can an EKF such as robot_localization fuse?",
      options: [
        "Raw triangles from a mesh",
        "A scan-matcher pose or odometry estimate with covariance",
        "A screenshot of the map",
      ],
      answer: 1,
      explanation:
        "The EKF uses supported state measurements and uncertainty. Raw LaserScan is processed by a scan matcher, not directly fused as a pose.",
    },
    {
      question:
        "Nav2 plans too close to shelving. Which configuration deserves attention?",
      options: [
        "The physical footprint and costmap inflation",
        "The editor's font size",
        "The ROS package logo",
      ],
      answer: 0,
      explanation:
        "The footprint and inflation represent the robot's clearance requirements. Check sensing and localization too; never tune only for visual appearance.",
    },
    {
      question:
        "Can Rover's two-joint arm reach every six-dimensional tool pose?",
      options: [
        "Yes, with enough CPU",
        "Yes, if all collisions are disabled",
        "No; use reachable constrained goals or a suitable higher-DOF arm",
      ],
      answer: 2,
      explanation:
        "Software cannot create missing mechanical degrees of freedom. Match planning goals to the arm's actual workspace and constraints.",
    },
  ],
};
