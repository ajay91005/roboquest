# Quest 01.03: URDF & TF2

## Learning contract

**Product:** Rover MK.01, a differential-drive base with a two-joint teaching arm.
**Prerequisites:** metres/radians, rigid links and right-handed coordinates.
**Outcome:** explain parent-relative transforms, construct a connected robot,
diagnose a valid-but-wrong chain and verify it visually and with native TF2.
**Reward:** 250 XP once, unlocking electronics. A separate mechanics checkpoint
awards 100 XP after the live quest.

The starter includes the chassis, wheels, caster, LiDAR and arm. Its tool joint
deliberately attaches to the base. This is debugging mode; replace the source to
practice authoring the complete description from scratch. The complete reference
is in `src/lib/robot.ts`, exported to the native package by `npm run export:robot`.

## Frame tree

```text
base_footprint
└── base_link
    ├── left_wheel
    ├── right_wheel
    ├── caster_link
    ├── lidar_link
    └── arm_base
        └── upper_arm      shoulder_joint
            └── forearm    elbow_joint
                └── tool0  tool_joint (fixed)
```

A joint origin is the parent-relative transform to the child at zero joint
position. Joint axes are expressed in the joint frame; RPY uses radians. ROS
convention is X forward, Y left, Z up. Visual origins position geometry inside
a link and do not replace the link-to-link transform.

The correction is:

```xml
<joint name="tool_joint" type="fixed">
  <parent link="forearm"/>
  <child link="tool0"/>
  <origin xyz="0 0 0.28"/>
</joint>
```

Attaching directly to `base_link` bypasses the moving arm transforms. Valid XML
and a connected tree are necessary, but do not establish correct kinematics.

## Validation and rendering

`src/lib/validate-urdf.ts` uses a structured XML parser, then checks:

1. Bounded, well-formed XML without entities, external meshes/textures or raw XACRO.
2. Unique, non-empty link and joint names.
3. Existing parents/children, one parent per child, no cycles, one base_footprint root.
4. Supported joint types, finite origins, nonzero axes, appropriate motion limits.
5. Visible geometry and positive, finite box/cylinder/sphere dimensions.
6. Required mobile-manipulator frames and named moving wheel/arm chains.
7. Fixed `forearm -> tool0` at `[0, 0, 0.28]`, within numerical tolerance.

The validator is a teaching subset, not full URDF-schema conformance, CAD
tolerance verification, positive-definite inertia checking or safety certification.
The reference has base inertia only; add the remaining physical properties before
Gazebo. User Python/C++/launch code is saved/exported, not browser-executed.

The viewer parses validated source with URDFLoader in a Three.js Z-up scene.
Limit-aware joint updates animate the robot. Replaced geometry/materials and
unmounted controls/animation loops are disposed. ResizeObserver maintains sizing.

## Astra progression

1. Ask which link the gripper should move with; connected is not always correct.
2. Identify `tool_joint`, whose current parent bypasses the arm.
3. Offer the minimal parent change and ask which frame defines the offset.

The mentor uses current source and deterministic validation. Local hints and
topic explanations are in `src/lib/mentor.ts`. There is no model provider or API.

## Native TF2 verification

The launch file expands a trusted local URDF/XACRO, starts robot_state_publisher,
publishes timestamped joint states and runs `tf_probe.py`. Fixed joints go to
`/tf_static`; moving joints go to `/tf`.

```bash
source /opt/ros/humble/setup.bash
source backend/ros2_ws/install/setup.bash
ros2 launch roboquest_description preview.launch.py
```

In another sourced terminal:

```bash
ros2 topic echo /joint_states --once
ros2 run tf2_ros tf2_echo forearm tool0
ros2 run tf2_ros tf2_echo base_link tool0
```

The first transform stays at `[0, 0, 0.28]` with identity rotation. The second
changes with the arm. This distinguishes fixed local and moving composed frames.
The browser's frame axes are computed from URDF, not a native TF2 buffer.

## XACRO extension

In a trusted local model, replace repeated wheel geometry with a macro:

```xml
<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="wheel_example">
  <xacro:property name="radius" value="0.15"/>
  <xacro:macro name="wheel" params="name side">
    <link name="${name}">
      <visual>
        <origin rpy="${pi/2} 0 0"/>
        <geometry><cylinder radius="${radius}" length="0.075"/></geometry>
      </visual>
    </link>
    <joint name="${name}_joint" type="continuous">
      <parent link="base_link"/><child link="${name}"/>
      <origin xyz="0 ${side * 0.26} 0"/><axis xyz="0 1 0"/>
    </joint>
  </xacro:macro>
  <link name="base_link"/>
  <xacro:wheel name="left_wheel" side="1"/>
  <xacro:wheel name="right_wheel" side="-1"/>
</robot>
```

This is a macro exercise, not the complete quest robot. Expand it locally:

```bash
xacro wheel_example.urdf.xacro -o wheel_example.urdf
```

Integrate the macro into the complete Rover model and expand before browser
import. XACRO can access files/substitutions; do not expose it to arbitrary online
input without isolation.

## Acceptance

Tests cover reference success, the single starter failure, missing parents,
cycles, duplicates, zero axes, inverted limits, unsafe mesh input, malformed XML,
progressive hints, no duplicate XP, persisted completion and visible animated
canvas pixels at desktop/tablet/mobile sizes.

Remaining external checks: actual native package execution, TF timing and live
gateway telemetry. The included CI container build is not evidence of a live deployment.
