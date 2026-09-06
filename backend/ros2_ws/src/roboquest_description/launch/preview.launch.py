"""A native TF2 demonstration. No Gazebo dynamics are implied by this launch."""
from pathlib import Path
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch.substitutions import Command


def generate_launch_description():
    default_model = Path(get_package_share_directory("roboquest_description")) / "urdf" / "rover.urdf"
    return LaunchDescription([
        DeclareLaunchArgument("model", default_value=str(default_model)),
        Node(
            package="robot_state_publisher", executable="robot_state_publisher",
            parameters=[{"robot_description": ParameterValue(
                Command(["xacro ", LaunchConfiguration("model")]), value_type=str
            ), "use_sim_time": False}], output="screen",
        ),
        Node(package="roboquest_description", executable="joint_demo.py", output="screen"),
        Node(package="roboquest_description", executable="tf_probe.py", output="screen"),
    ])