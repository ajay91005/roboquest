FROM ros:humble-ros-base-jammy
SHELL ["/bin/bash", "-c"]
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-pip python3-colcon-common-extensions \
    ros-humble-robot-state-publisher ros-humble-xacro \
    ros-humble-tf2-ros ros-humble-rosbridge-server \
    && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 rover
WORKDIR /home/rover/app
COPY requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt
COPY --chown=rover:rover ros2_ws /home/rover/ws
USER rover
RUN source /opt/ros/humble/setup.bash && cd /home/rover/ws && colcon build --symlink-install
COPY --chown=rover:rover gateway.py gateway_policy.py entrypoint.sh ./
ENV HOME=/home/rover ROS_LOCALHOST_ONLY=1 PORT=7860
EXPOSE 7860
ENTRYPOINT ["/bin/bash", "/home/rover/app/entrypoint.sh"]