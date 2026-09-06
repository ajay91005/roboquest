# Deployment Guide

## Free-only design

RoboQuest is a static website. There is no database, authentication service,
AI provider, server function or hosted ROS dependency. Visitors need only a
modern browser with WebGL. Progress stays on their device and can be exported.

Use a free Vercel Hobby account for eligible personal/noncommercial use. Quotas
and provider terms still apply; do not enable a paid plan, spend add-on or trial.
The default `vercel.app` domain is sufficient. See the current
[Hobby terms](https://vercel.com/docs/plans/hobby) before publishing.

Native ROS runs locally on your own computer. No hosted Docker Space or remote
simulation service is required or recommended for this free-only release.

## Local setup

Install Node.js 22 LTS and npm. In the project directory:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Installation builds the self-hosted Monaco editor,
worker and license notices. Do not disable lifecycle scripts. Fonts download
at build time and are served locally afterwards. No `.env` file is needed.

For a production preview:

```bash
npm run build
npm start
```

`out/` is the deployable website. Use an HTTP server, not `file://`, because
Monaco workers and module assets require normal URL loading. The start script
serves port 3000; for a second preview run `npx serve out -l 3001`.

## Private GitHub repository

Source must remain private. Authenticate directly in GitHub CLI or your browser;
never paste tokens into source, chat or Git remote URLs.

```bash
git init -b main
git add .
git status --short
git commit -m "Release RoboQuest free learning game"
gh auth login
gh repo create roboquest --private --source=. --remote=origin --push
gh repo view --json nameWithOwner,isPrivate,url
```

Use these initialization commands only for a new repository. If `origin` already
exists, verify it and push the current branch normally. Check `.gitignore` before
staging; dependencies, generated editor assets, builds and local settings are excluded.

Private source does not hide JavaScript delivered to a public browser. Do not put
secrets or confidential content in the app. No project license grant is assumed;
third-party dependencies keep their own license requirements.

## Vercel deployment

```bash
npx vercel login
npx vercel
npx vercel --prod
```

Choose a personal Hobby account, the project directory and the Next.js preset.
The checked-in configuration builds with `npm run build` and publishes `out/`.
No environment variables are required. Do not select a paid team or paid plan.

Alternatively, import the private GitHub repository through Vercel's dashboard
and grant access only to this repository. This enables automatic deployments.
Keep production visitor access public; a private repository should not force
players to sign in to the hosting provider. Preview protection can remain enabled.

Before sharing the resulting HTTPS URL, verify it in a signed-out browser:

1. `/` shows the introduction and a working Start button.
2. `/play/` loads directly, including after a hard refresh.
3. The editor and robot render without asset or console errors.
4. Repair the tool transform, earn 250 XP and reload.
5. Complete mechanics, verify electronics unlocks, and export a journey backup.
6. Test mobile layout and confirm there is no provider authentication wall.

The website supports static hosting at a domain root. Subdirectory hosting needs
base-path-aware Monaco/worker URLs and is not configured. Do not assume private
GitHub Pages publishing is included in every free GitHub plan.

## Local ROS with Docker

Use Docker Engine or a Docker Desktop installation eligible under its free
personal-use terms. Windows needs Linux containers through WSL2. Native Ubuntu
below is the alternative when Docker Desktop licensing does not apply.

```bash
npm run export:robot
docker build -t roboquest-ros backend
docker run --rm --name roboquest-ros -p 127.0.0.1:7860:7860 \
  -e ALLOWED_ORIGINS=http://localhost:3000 roboquest-ros
```

Run the frontend locally and connect to `ws://localhost:7860`. Port 9090 stays
inside the container. The gateway permits read-only synthetic telemetry only;
never connect this public demo to real actuators. A hosted HTTPS page requires
WSS, so use the local frontend for the free local ROS workflow.

```bash
docker exec -it roboquest-ros bash
source /opt/ros/humble/setup.bash
source /home/rover/ws/install/setup.bash
ros2 topic echo /joint_states --once
ros2 run tf2_ros tf2_echo base_link tool0
```

The connection survives closing the dialog. Three seconds of stale joint data
releases the local controls. Gateway HTTP health is liveness, not ROS readiness;
verify actual joint messages and TF output. Docker was unavailable in the
authoring environment, so these runtime checks remain an external requirement.

## Native Ubuntu 22.04

Install [ROS 2 Humble](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html).
Initialize rosdep once if needed, then:

```bash
sudo apt update
sudo apt install python3-colcon-common-extensions python3-rosdep \
  ros-humble-robot-state-publisher ros-humble-xacro ros-humble-tf2-ros \
  ros-humble-rosbridge-server
source /opt/ros/humble/setup.bash
cd backend/ros2_ws
rosdep update
rosdep install --from-paths src --ignore-src -r -y
colcon build --symlink-install
source install/setup.bash
ros2 launch roboquest_description preview.launch.py
```

In another sourced terminal, run `ros2 run roboquest_description heartbeat` for
the C++ example. A trusted exported model can be passed to the launch file with
`model:=/absolute/path/rover.urdf`. Do not expose launch or XACRO to internet input.

## Release checks

```bash
npm ci
npx playwright install chromium
npm run verify
python -m unittest discover -s backend/tests
```

CI checks the browser application and builds the optional native container.
Private GitHub Actions consumes your account's free minutes and artifact quota.
Keep paid overages disabled; retain artifacts briefly and monitor quota usage.

## Troubleshooting

- Editor missing: run `npm run prepare:editor`; check `/monaco/` asset requests.
  The editable textarea fallback remains available if Monaco cannot load.
- Blank robot: enable WebGL/hardware acceleration and inspect the viewer error.
- Save unavailable: export a backup; browser quotas/private modes can restrict storage.
- Mission locked: finish the preceding phase. Mechanics requires the URDF build;
  control requires the wheel-speed challenge as well as the decisions.
- Bridge offline: verify the allowed origin, local port and `/joint_states` independently.
- Physics/autonomy: see the architecture guide. These are native follow-on exercises,
  not finished Gazebo/Nav2/MoveIt simulations inside the browser.
