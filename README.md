# RoboQuest: The Path to Principal Engineer

A free, playable foundation for product-based robotics learning. Build Rover MK.01, a
differential-drive mobile manipulator, from its first coordinate frame toward
integrated autonomy. Built with Next.js 16, React 19, Tailwind 4, Three.js,
URDFLoader, Monaco and ROSLIB. No account, API key, database or paid model is needed.

## Run locally

Requires Node.js 22 LTS and npm. From this directory:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No accounts, API keys or ROS installation are needed.
`npm ci` builds a self-hosted Monaco bundle and worker. Next.js downloads fonts at
build time and serves them locally at runtime.

## Implemented scope

- Responsive garage with Monaco XML, Python, C++ and launch-file editing.
- An introduction for first-time learners, returning-player entry and guided missions.
- Actual URDF rendering, orbit/zoom, joint animation, sliders, frame axes and fullscreen.
- A complete URDF/TF2 debugging quest with seven checks, progressive hints,
  idempotent XP rewards and phase unlocks. The source can also be authored from scratch.
- Six curriculum modules, 24 topic briefings, 18 engineering decisions and six
  knowledge checkpoints. Advanced exercises are native-ROS briefs, not full simulations.
- A scored PID tuning challenge with saturation, anti-windup and measurable targets.
- Eight milestones worth 1,000 XP, prerequisite-based unlocks and completion rewards.
- Versioned local saves, source export and portable journey backups with confirmed restore.
- Free rule-based Astra hints and topic help, entirely inside the browser.
- A native Humble package with JointState publishing, a TF2 listener, a C++ node,
  launch configuration, and a Docker telemetry gateway.

**Boundaries:** the browser preview is kinematics, not physics or ROS DDS.
Python/C++ source is saved and exported, never executed by the page. The included
backend runs real ROS 2 transform publishing, not Gazebo/Nav2/MoveIt. It accepts
no arbitrary learner code. The teaching arm has two actuated joints, not general
six-degree-of-freedom manipulation capability.

## Try the first quest

1. Read the quest briefing and build the starter description.
2. Observe the single failure: `tool_joint` attaches the tool to the base.
3. Change its parent to `forearm`, retaining the fixed joint and `xyz="0 0 0.28"`.
4. Build again. All seven checks pass; 250 XP is awarded once.
5. Animate the arm and enable TF frames. The tool now follows the forearm.
6. Complete the mechanics checkpoint and continue through the tech tree.

## Project directory

```text
roboquest/
├── src/
│   ├── app/
│   │   ├── globals.css              Responsive instrument-panel UI
│   │   ├── layout.tsx               Fonts, metadata, generated editor CSS
│   │   ├── play/page.tsx            Playable garage
│   │   └── page.tsx                 New-player introduction
│   ├── components/
│   │   ├── dashboard.tsx            Game state, lessons, tech tree and plots
│   │   ├── introduction.tsx         First visit and continue journey
│   │   ├── mission-lesson.tsx       Guided briefings and decisions
│   │   ├── code-editor.tsx          Same-origin Monaco and textarea fallback
│   │   ├── robot-viewer.tsx         Three.js / URDFLoader joint rendering
│   │   └── ros-connection.tsx       Read-only ROSLIB and stale-data handling
│   └── lib/
│       ├── curriculum.ts            Six phases, 24 topics, checkpoints
│       ├── robot.ts                 Reference and starter URDF
│       ├── validate-urdf.ts         Structural and quest-specific checks
│       ├── mentor.ts                Progressive hints and topic help
│       ├── progress.ts              Local save schema and validation
│       ├── game.ts                  Milestones, prerequisites and decisions
│       └── control.ts               Discrete PID teaching model
├── scripts/
│   ├── export-robot.ts              Export the tested native model
│   └── prepare-editor.mjs           Bundle Monaco with patched DOMPurify
├── public/monaco/                   Generated editor, CSS, worker, legal notices
├── backend/
│   ├── Dockerfile
│   ├── README.md                   Local runtime guide
│   ├── requirements.txt
│   ├── entrypoint.sh               ROS and gateway supervision
│   ├── gateway.py                  Origin/capacity-limited WebSocket proxy
│   ├── gateway_policy.py           Subscription-only allowlist
│   ├── tests/test_gateway.py
│   └── ros2_ws/src/roboquest_description/
│       ├── CMakeLists.txt
│       ├── package.xml
│       ├── launch/preview.launch.py
│       ├── scripts/joint_demo.py
│       ├── scripts/tf_probe.py
│       ├── src/heartbeat.cpp
│       └── urdf/rover.urdf
├── tests/
│   ├── urdf.test.ts
│   ├── learning.test.ts
│   ├── game.test.ts
│   └── e2e/                        Introduction, garage and full journey tests
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── URDF-TF2-QUEST.md
├── .github/workflows/ci.yml
├── vercel.json
├── next.config.ts
├── eslint.config.mjs
├── playwright.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── package-lock.json
```

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
python -m unittest discover -s backend/tests
npm audit
```

Playwright completes all six phases and both practical milestones, tests wrong
answers and backup restoration, and checks canvas pixels, animation, TF toggles,
editor tabs and overflow at desktop/tablet/mobile sizes.
Screenshots are generated in `test-results/`. CI also builds the ROS container.

The authoring environment verified the frontend build, unit/browser tests and
gateway policy. Docker was unavailable, so native container execution remains a
required external check. Deployment status is recorded separately in the release
notes; local tests alone do not prove an online deployment.

## Guides and free deployment

- [Architecture](docs/ARCHITECTURE.md): runtime, curriculum, security, Gazebo and WASM extensions.
- [Deployment](docs/DEPLOYMENT.md): private GitHub, free static hosting and local ROS.
- [URDF/TF2 Quest](docs/URDF-TF2-QUEST.md): lesson, frame tree, validation and native verification.

The build produces a static `out/` directory. Vercel Hobby supports eligible
personal/noncommercial projects subject to free usage limits. No paid cloud
dependency exists in the app. Keep native ROS on your own computer. A private
source repository does not make downloaded browser JavaScript private.

## Production preview

```bash
npm run build
npm start
```

The introduction is at `/`; the garage is at `/play/`. Clearing browser data
removes local progress. Export a journey backup before changing devices or hosts.
XP records learning progress, not a professional certification.
