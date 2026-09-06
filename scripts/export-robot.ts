import { mkdirSync, writeFileSync } from "node:fs";
import { referenceUrdf } from "../src/lib/robot";
import { validateUrdf } from "../src/lib/validate-urdf";

if (!validateUrdf(referenceUrdf).passed)
  throw new Error("Reference model is invalid");
const directory = "backend/ros2_ws/src/roboquest_description/urdf";
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/rover.urdf`, referenceUrdf + "\n");
console.log("Exported the tested reference URDF for native ROS.");
