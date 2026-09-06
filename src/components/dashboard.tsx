"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  CircuitBoard,
  Save,
  Code2,
  Compass,
  Cpu,
  FileCode2,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Maximize2,
  Network,
  Pause,
  Play,
  PlugZap,
  Radio,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Terminal,
  Trophy,
  Upload,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { curriculum, type Phase } from "@/lib/curriculum";
import {
  initialProgress,
  parseProgress,
  STORAGE_KEY,
  type Progress,
} from "@/lib/progress";
import { starterUrdf } from "@/lib/robot";
import { validateUrdf, type Validation } from "@/lib/validate-urdf";
import { localHint } from "@/lib/mentor";
import { simulatePid, evaluatePid } from "@/lib/control";
import {
  earnedXp,
  milestones,
  nextMission,
  phaseRequirement,
  phaseUnlocked,
  totalXp,
} from "@/lib/game";
import RosConnection from "./ros-connection";
import MissionLesson from "./mission-lesson";

const Editor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading editor...</div>,
});
const RobotViewer = dynamic(() => import("./robot-viewer"), {
  ssr: false,
  loading: () => <div className="editor-loading">Preparing robot...</div>,
});
const phaseIcons = [Wrench, CircuitBoard, Cpu, Network, Layers3, Compass];
const files = [
  { id: "urdf", name: "rover.urdf", language: "xml" },
  { id: "python", name: "node.py", language: "python" },
  { id: "cpp", name: "node.cpp", language: "cpp" },
  { id: "launch", name: "bringup.launch.py", language: "python" },
];
type Message = { role: "astra" | "you"; text: string };

export default function Dashboard() {
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("urdf");
  const [view, setView] = useState("garage");
  const [source, setSource] = useState(starterUrdf);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [running, setRunning] = useState(false);
  const [frames, setFrames] = useState(false);
  const [shoulder, setShoulder] = useState(0.28);
  const [elbow, setElbow] = useState(0.9);
  const [resetKey, setResetKey] = useState(0);
  const [telemetry, setTelemetry] = useState<Record<string, number>>();
  const [modal, setModal] = useState<
    "backup" | "bridge" | "resources" | "reset" | null
  >(null);
  const [lesson, setLesson] = useState<Phase | null>(null);
  const [notice, setNotice] = useState("");
  const [pendingSave, setPendingSave] = useState<Progress | null>(null);
  const [saveState, setSaveState] = useState("Loading save");
  const [celebration, setCelebration] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "astra",
      text: "Every great robot starts with a solid frame. Your Rover's tool is connected, but is it connected to the right link? Let's investigate.",
    },
  ]);
  const [gains, setGains] = useState({ kp: 2, ki: 0.8, kd: 0.05 });
  const viewerPanel = useRef<HTMLDivElement>(null);
  const messageEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = parseProgress(JSON.parse(stored));
        setProgress(saved);
        const checked = validateUrdf(saved.snippets.urdf);
        if (
          checked.checks
            .filter((check) => check.id !== "tool")
            .every((check) => check.passed)
        )
          setSource(saved.snippets.urdf);
      }
    } catch {
      setNotice("Local save unavailable. You can still export your code.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setSaveState("Saved on this device");
    } catch {
      setNotice("Storage is full or disabled. Export your code to keep it.");
      setSaveState("Not saved: export a backup");
    }
  }, [loaded, progress]);
  useEffect(() => {
    const container = messageEnd.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const completed = progress.completed.includes("urdf-tf2");
  const xp = earnedXp(progress.completed);
  const nextTask = nextMission(progress.completed);
  const pidResult = evaluatePid(gains.kp, gains.ki, gains.kd);
  const currentFile = files.find((file) => file.id === tab)!;
  const code = progress.snippets[tab];
  const validCount =
    validation?.checks.filter((check) => check.passed).length ?? 0;
  function updateCode(value: string | undefined) {
    if (tab === "urdf") setValidation(null);
    if (value !== undefined)
      setProgress((previous) => ({
        ...previous,
        snippets: { ...previous.snippets, [tab]: value },
      }));
  }
  function complete(id: string) {
    setProgress((previous) => ({
      ...previous,
      completed: [...new Set([...previous.completed, id])],
    }));
  }
  function build() {
    if (tab !== "urdf") {
      setNotice(
        "Python, C++ and launch files are saved as source. Execute them in the documented native ROS workspace.",
      );
      return;
    }
    const result = validateUrdf(code);
    setValidation(result);
    if (
      result.checks
        .filter((check) => check.id !== "tool")
        .every((check) => check.passed)
    )
      setSource(code);
    if (result.passed) {
      complete("urdf-tf2");
      if (!completed) setCelebration(true);
      setNotice(
        completed
          ? "Build passed. Robot description updated."
          : "Rover's arm is connected. +250 XP! Finish the mechanics mission to unlock electronics.",
      );
    } else
      setNotice(
        `${result.checks.filter((check) => !check.passed).length} check(s) need attention. See the build console.`,
      );
  }
  function askAstra(text = question) {
    if (asking) return;
    const level = Math.min(hintLevel + 1, 3);
    setHintLevel(level);
    setQuestion("");
    setAsking(true);
    const prompt = text.trim() || "Give me the next hint for this quest.";
    setMessages((previous) => [...previous, { role: "you", text: prompt }]);
    const reply = localHint(
      validateUrdf(progress.snippets.urdf),
      level,
      prompt,
    );
    setMessages((previous) => [...previous, { role: "astra", text: reply }]);
    setAsking(false);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = currentFile.name;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${currentFile.name} exported.`);
  }
  function exportSave() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "roboquest-save.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  async function importSave(file?: File) {
    if (!file) return;
    try {
      if (file.size > 500_000)
        throw new Error("Choose a RoboQuest save smaller than 500 KB.");
      const value = JSON.parse(await file.text());
      if (
        value?.version !== 1 ||
        !Array.isArray(value.completed) ||
        !value.snippets ||
        typeof value.snippets.urdf !== "string"
      )
        throw new Error("This does not look like a RoboQuest save.");
      setPendingSave(parseProgress(value));
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not read this save.",
      );
    }
  }
  function restoreSave() {
    if (!pendingSave) return;
    setProgress(pendingSave);
    setValidation(null);
    const result = validateUrdf(pendingSave.snippets.urdf);
    setSource(
      result.checks.every((check) => check.passed || check.id === "tool")
        ? pendingSave.snippets.urdf
        : starterUrdf,
    );
    setPendingSave(null);
    setModal(null);
    setNotice("Journey restored. Your imported code and milestones are ready.");
  }
  function unlocked(index: number) {
    return phaseUnlocked(index, progress.completed);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="RoboQuest home">
          <span className="brand-icon">
            <Box size={25} />
          </span>
          <span>
            robo<span className="brand-light">quest</span>
            <small>BUILD. LEARN. EVOLVE.</small>
          </span>
        </Link>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="main-nav" aria-label="Workspace">
          <Nav
            icon={Box}
            label="Virtual garage"
            active={view === "garage"}
            onClick={() => setView("garage")}
          />
          <Nav
            icon={GitBranch}
            label="Tech tree"
            active={view === "tree"}
            onClick={() => setView("tree")}
            badge="6"
          />
          <Nav
            icon={FlaskConical}
            label="Control lab"
            active={view === "control"}
            onClick={() => setView("control")}
          />
          <Nav
            icon={BookOpen}
            label="Field notes"
            active={false}
            onClick={() => setModal("resources")}
          />
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">ENGINEERING PATH</div>
        <div className="path-nav">
          {curriculum.map((phase, index) => {
            const Icon = phaseIcons[index];
            return (
              <button
                key={phase.id}
                onClick={() => {
                  if (unlocked(index)) setLesson(phase);
                  else
                    setNotice(
                      `Complete ${index === 1 ? "the URDF & TF2 quest" : curriculum[index - 1].title + " checkpoint"} to unlock this phase.`,
                    );
                }}
                className={`${index === 0 ? "current" : ""} ${!unlocked(index) ? "locked" : ""}`}
              >
                <span className="path-icon">
                  {progress.completed.includes(phase.id) ? (
                    <Check size={14} />
                  ) : (
                    <Icon size={14} />
                  )}
                </span>
                <span>{phase.short}</span>
                {!unlocked(index) && <LockKeyhole size={11} />}
              </button>
            );
          })}
        </div>
        <div className="sidebar-bottom">
          <div className="rank-label">
            <GraduationCap size={16} />
            <span>ENGINEER RANK</span>
          </div>
          <strong>
            {xp >= 650
              ? "Systems builder"
              : xp >= 250
                ? "Robot builder"
                : "Apprentice"}
            <span>LVL {1 + Math.floor(xp / 250)}</span>
          </strong>
          <div className="progress-track">
            <i style={{ width: `${(xp / totalXp) * 100}%` }} />
          </div>
          <div className="xp-caption">
            {xp} XP earned <Zap size={12} />
          </div>
          <button className="profile" onClick={() => setModal("backup")}>
            <span className="avatar">ME</span>
            <span>
              My engineering journey
              <small>{saveState}</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <strong>
              {view === "tree"
                ? "Tech tree"
                : view === "control"
                  ? "Control lab"
                  : "Virtual garage"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="ros-badge">
              <span className="status-dot" /> ROS 2 Humble
            </span>
            <button
              title="Journey backup"
              aria-label="Journey backup"
              className="icon-button"
              onClick={() => setModal("backup")}
            >
              <Save size={18} />
            </button>
            <button
              title="Field notes"
              aria-label="Field notes"
              className="icon-button"
              onClick={() => setModal("resources")}
            >
              <CircleHelp size={18} />
            </button>
            <span className="avatar small">ME</span>
          </div>
        </header>
        <main>
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-line" /> THE PATH TO PRINCIPAL ENGINEER
              </div>
              <h1>
                {view === "tree"
                  ? "Your engineering path"
                  : view === "control"
                    ? "Precision starts here."
                    : "Welcome to your garage."}
              </h1>
              <p>
                {view === "tree"
                  ? "One robot. Six disciplines. A whole new way to think."
                  : view === "control"
                    ? "Model the response. Understand the trade-offs."
                    : "From your first link to an autonomous machine. Let's build something."}
              </p>
            </div>
            <button
              className="secondary-button bridge-button"
              onClick={() => setModal("bridge")}
            >
              <PlugZap size={15} />
              {telemetry ? "ROS connected" : "Connect ROS"}
              <span className={telemetry ? "status-dot" : "offline-dot"} />
            </button>
          </section>
          {view === "garage" && (
            <>
              <section className="project-strip">
                <div className="project-symbol">
                  <Box size={24} />
                </div>
                <div className="project-name">
                  <small>YOUR MISSION</small>
                  <strong>
                    Rover MK.01 <span>Mobile manipulator</span>
                  </strong>
                </div>
                <div className="project-stat">
                  <small>PLATFORM</small>
                  <span>Differential drive + arm</span>
                </div>
                <div className="project-stat">
                  <small>PROGRESS</small>
                  <span>
                    {progress.completed.length} / {milestones.length} milestones
                  </span>
                </div>
                <div className="project-progress">
                  <span>
                    {Math.round(
                      (progress.completed.length / milestones.length) * 100,
                    )}
                    %
                  </span>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${(progress.completed.length / milestones.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </section>
              {completed && (
                <section className="next-mission-banner">
                  <Trophy size={24} />
                  <div>
                    <small>
                      {xp === totalXp ? "FOUNDATION PATH COMPLETE" : "UP NEXT"}
                    </small>
                    <h2>{nextTask}</h2>
                    <p>
                      {xp === totalXp
                        ? "1,000 XP earned. Keep experimenting in the labs, or take Rover into native ROS."
                        : "Rover's transform is repaired. Your next engineering decision awaits."}
                    </p>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setView("tree");
                      setLesson(
                        curriculum.find(
                          (phase) => !progress.completed.includes(phase.id),
                        ) ?? null,
                      );
                    }}
                  >
                    {xp === totalXp ? "Review journey" : "Continue mission"}
                    <ArrowRight size={15} />
                  </button>
                </section>
              )}
              <div className="garage-grid">
                <aside className="quest-column">
                  <div className="section-kicker">
                    <span className="status-dot" /> ACTIVE QUEST{" "}
                    <span>01.03</span>
                  </div>
                  <div className="quest-title">
                    <div className="quest-category">MECHANICS & MODELING</div>
                    <h2>
                      A body.
                      <br />A frame.
                      <br />
                      <span>A beginning.</span>
                    </h2>
                    <p>
                      Build your robot&apos;s description and connect its world
                      with URDF & TF2.
                    </p>
                    <div className="quest-meta">
                      <span>
                        <Zap size={12} />
                        250 XP
                      </span>
                      <span>
                        <BookOpen size={12} />
                        20 min
                      </span>
                      <span className="level-badge">FOUNDATION</span>
                    </div>
                  </div>
                  <div className="objectives">
                    <h3>
                      Mission objectives{" "}
                      <span>{completed ? "3/3" : "0/3"}</span>
                    </h3>
                    {[
                      "Define the robot's links & joints",
                      "Connect the tool's transform",
                      "Validate your kinematic tree",
                    ].map((item) => (
                      <div key={item}>
                        <span
                          className={
                            completed
                              ? "objective-check done"
                              : "objective-check"
                          }
                        >
                          {completed && <Check size={10} />}
                        </span>
                        {item}
                      </div>
                    ))}
                    <button
                      className="text-button"
                      onClick={() => setLesson(curriculum[0])}
                    >
                      Open quest briefing <ArrowRight size={14} />
                    </button>
                  </div>
                  <section className="mentor-panel">
                    <div className="mentor-heading">
                      <div className="astra-avatar">
                        <Sparkles size={17} />
                      </div>
                      <div>
                        <strong>
                          Astra<span>-Bot</span>
                        </strong>
                        <small>YOUR CHIEF ENGINEER</small>
                      </div>
                      <span className="status-dot" />
                    </div>
                    <div className="mentor-messages" aria-live="polite">
                      {messages.map((message, index) => (
                        <p
                          key={index}
                          className={
                            message.role === "you" ? "user-message" : ""
                          }
                        >
                          {message.role === "you" && <small>YOU</small>}
                          {message.text}
                        </p>
                      ))}
                      {asking && (
                        <p className="muted">Reviewing your description...</p>
                      )}
                      <div ref={messageEnd} />
                    </div>
                    <button
                      className="hint-button"
                      disabled={asking}
                      onClick={() =>
                        askAstra("Help me find the transform issue")
                      }
                    >
                      <Sparkles size={13} />
                      Give me a hint <span>{Math.min(hintLevel, 3)}/3</span>
                    </button>
                    <form
                      className="mentor-input"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (question.trim()) void askAstra();
                      }}
                    >
                      <input
                        aria-label="Ask Astra"
                        placeholder="Ask Astra a question..."
                        maxLength={1000}
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                      />
                      <button
                        aria-label="Send to Astra"
                        title="Send question"
                        disabled={asking || !question.trim()}
                      >
                        <Send size={14} />
                      </button>
                    </form>
                    <div className="mentor-footnote">
                      RULE-BASED GUIDE / NO API KEY
                    </div>
                  </section>
                </aside>
                <section className="workbench">
                  <div className="workbench-header">
                    <div>
                      <Code2 size={16} />
                      <strong>Robot workbench</strong>
                      <span className="subtle-badge">URDF & TF2</span>
                    </div>
                    <button className="primary-button" onClick={build}>
                      <Play size={13} fill="currentColor" /> Build & validate
                    </button>
                  </div>
                  <div className="editor-viewer">
                    <div className="editor-panel">
                      <div
                        className="file-tabs"
                        role="tablist"
                        aria-label="Source files"
                      >
                        {files.map((file) => (
                          <button
                            role="tab"
                            aria-selected={tab === file.id}
                            className={tab === file.id ? "active" : ""}
                            onClick={() => setTab(file.id)}
                            key={file.id}
                          >
                            <FileCode2 size={12} />
                            {file.name}
                          </button>
                        ))}
                      </div>
                      <div className="editor-path">
                        <span>rover_description / {currentFile.name}</span>
                        <button
                          className="icon-button"
                          title="Export source"
                          aria-label="Export source"
                          onClick={download}
                        >
                          <ArrowDownToLine size={13} />
                        </button>
                      </div>
                      <Editor
                        height="398px"
                        language={currentFile.language}
                        path={currentFile.name}
                        value={code}
                        onChange={updateCode}
                        theme="vs-dark"
                        beforeMount={(monaco) =>
                          monaco.editor.defineTheme("roboquest", {
                            base: "vs-dark",
                            inherit: true,
                            rules: [
                              { token: "tag", foreground: "79CDB5" },
                              { token: "attribute.name", foreground: "B9C4D7" },
                              {
                                token: "attribute.value",
                                foreground: "D5B989",
                              },
                              { token: "comment", foreground: "617574" },
                            ],
                            colors: {
                              "editor.background": "#101619",
                              "editorLineNumber.foreground": "#445254",
                              "editorLineNumber.activeForeground": "#9BAEAE",
                              "editor.lineHighlightBackground": "#172023",
                              "editor.selectionBackground": "#26443d",
                            },
                          })
                        }
                        onMount={(_editor, monaco) =>
                          monaco.editor.setTheme("roboquest")
                        }
                        options={{
                          minimap: { enabled: false },
                          fontSize: 11,
                          lineHeight: 21,
                          fontFamily: "var(--font-geist-mono), monospace",
                          padding: { top: 12 },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          wordWrap: "on",
                          tabSize: 2,
                          folding: true,
                          lineNumbersMinChars: 3,
                          renderLineHighlight: "all",
                        }}
                      />
                      <div className="editor-status">
                        <span>
                          <span className="status-dot" />
                          {loaded ? "Saved locally" : "Loading"}
                        </span>
                        <span>
                          {currentFile.language.toUpperCase()}
                          <span>UTF-8</span>
                        </span>
                      </div>
                    </div>
                    <div className="viewer-panel" ref={viewerPanel}>
                      <div className="viewer-toolbar">
                        <span>
                          <Box size={13} />
                          3D VIEWPORT
                        </span>
                        <div>
                          <span className="preview-badge">
                            {telemetry ? "ROS TELEMETRY" : "KINEMATIC PREVIEW"}
                          </span>
                          <button
                            className="icon-button"
                            title="Reset camera"
                            aria-label="Reset camera"
                            onClick={() => setResetKey((value) => value + 1)}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            className="icon-button"
                            title="Fullscreen viewport"
                            aria-label="Fullscreen viewport"
                            onClick={() => {
                              if (document.fullscreenElement)
                                void document.exitFullscreen();
                              else
                                void viewerPanel.current
                                  ?.requestFullscreen()
                                  .catch(() =>
                                    setNotice(
                                      "Fullscreen is unavailable in this browser.",
                                    ),
                                  );
                            }}
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="scene-container">
                        <RobotViewer
                          source={source}
                          running={running}
                          frames={frames}
                          shoulder={shoulder}
                          elbow={elbow}
                          resetKey={resetKey}
                          telemetry={telemetry}
                        />
                        <div className="scene-label">
                          <span className="status-dot" /> ROVER MK.01
                          <small>
                            {source === starterUrdf
                              ? "STARTER DESCRIPTION"
                              : "YOUR DESCRIPTION"}
                          </small>
                        </div>
                        <div className="scene-coordinates">
                          <span className="axis-z">Z</span>
                          <span className="axis-y">Y</span>
                          <span className="axis-x">X</span>
                          <i />
                        </div>
                        <div className="scene-bottom">
                          <span>
                            METERS <span className="scale-line" /> 0.2 m
                          </span>
                          <span>PERSPECTIVE</span>
                        </div>
                      </div>
                      <div className="simulation-tools">
                        <button
                          title={
                            running ? "Pause joint animation" : "Animate joints"
                          }
                          aria-label={
                            running ? "Pause joint animation" : "Animate joints"
                          }
                          className={
                            running ? "play-button playing" : "play-button"
                          }
                          disabled={!!telemetry}
                          onClick={() => setRunning(!running)}
                        >
                          {running ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <span className="animation-label">
                          {telemetry
                            ? "Live joint states"
                            : running
                              ? "Joint animation"
                              : "Preview paused"}
                        </span>
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={frames}
                            onChange={(event) =>
                              setFrames(event.target.checked)
                            }
                          />
                          <span />
                          TF frames
                        </label>
                      </div>
                      <div className="joint-controls">
                        <label>
                          Shoulder{" "}
                          <input
                            aria-label="Shoulder joint"
                            type="range"
                            min="-1"
                            max="1"
                            step="0.01"
                            disabled={!!telemetry}
                            value={shoulder}
                            onChange={(event) =>
                              setShoulder(Number(event.target.value))
                            }
                          />
                          <output>{shoulder.toFixed(2)} rad</output>
                        </label>
                        <label>
                          Elbow{" "}
                          <input
                            aria-label="Elbow joint"
                            type="range"
                            min="-1.9"
                            max="1.9"
                            step="0.01"
                            disabled={!!telemetry}
                            value={elbow}
                            onChange={(event) =>
                              setElbow(Number(event.target.value))
                            }
                          />
                          <output>{elbow.toFixed(2)} rad</output>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="console-panel">
                    <div className="console-heading">
                      <span>
                        <Terminal size={14} />
                        Build console{" "}
                        <span className="console-count">
                          {validation
                            ? `${validCount}/${validation.checks.length}`
                            : "READY"}
                        </span>
                      </span>
                      <button
                        className="icon-button"
                        title="Reset source"
                        aria-label="Reset source"
                        onClick={() => setModal("reset")}
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                    <div className="console-output" role="log">
                      {validation ? (
                        validation.checks.map((check) => (
                          <div
                            key={check.id}
                            className={
                              check.passed ? "console-success" : "console-error"
                            }
                          >
                            <span>
                              {check.passed ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                            </span>
                            <span>
                              <b>{check.passed ? "PASS" : "FAIL"}</b>{" "}
                              {check.label}
                              {!check.passed && <small>{check.detail}</small>}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div>
                            <span className="console-time">[workspace]</span>
                            <span>
                              rover_description loaded. 10 links, 9 joints.
                            </span>
                          </div>
                          <div>
                            <span className="console-time">[validator]</span>
                            <span>
                              Ready for your first build.
                              <span className="terminal-cursor" />
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="console-footer">
                      <span>
                        <Radio size={11} />{" "}
                        {telemetry ? "ROS bridge connected" : "Browser sandbox"}
                      </span>
                      <span>No physics runtime connected</span>
                    </div>
                  </div>
                </section>
              </div>
              <section className="next-section">
                <div className="section-heading">
                  <h3>The next pieces of the puzzle</h3>
                  <button
                    className="text-button"
                    onClick={() => setView("tree")}
                  >
                    Explore tech tree <ArrowRight size={14} />
                  </button>
                </div>
                <div className="next-grid">
                  {curriculum.slice(1, 4).map((phase, offset) => {
                    const Icon = phaseIcons[offset + 1];
                    return (
                      <button
                        className="next-quest"
                        key={phase.id}
                        onClick={() => {
                          setView("tree");
                          if (unlocked(offset + 1)) setLesson(phase);
                        }}
                      >
                        <span className={`next-icon tone-${offset}`}>
                          <Icon size={20} />
                        </span>
                        <span>
                          <small>PHASE {phase.number}</small>
                          <strong>{phase.title}</strong>
                          <span>{phase.subtitle}</span>
                        </span>
                        {unlocked(offset + 1) ? (
                          <ArrowRight size={14} />
                        ) : (
                          <LockKeyhole size={14} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
          {view === "tree" && (
            <section className="tech-tree">
              {curriculum.map((phase, index) => {
                const Icon = phaseIcons[index];
                const open = unlocked(index);
                return (
                  <article
                    className={`phase-row ${open ? "unlocked" : ""}`}
                    key={phase.id}
                  >
                    <div className="phase-number">{phase.number}</div>
                    <div className="phase-description">
                      <div className="eyebrow">
                        {progress.completed.includes(phase.id)
                          ? "CHECKPOINT COMPLETE"
                          : open
                            ? "AVAILABLE"
                            : "LOCKED"}
                      </div>
                      <h2>
                        <Icon size={23} />
                        {phase.title}
                      </h2>
                      <p>{phase.subtitle}</p>
                      <div className="topic-tags">
                        {phase.topics.map((topic) => (
                          <span key={topic.title}>{topic.title}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="secondary-button"
                      disabled={!open}
                      onClick={() => setLesson(phase)}
                    >
                      {open ? (
                        <BookOpen size={15} />
                      ) : (
                        <LockKeyhole size={15} />
                      )}{" "}
                      {open ? "Open phase" : "Locked"}
                    </button>
                  </article>
                );
              })}
              <p className="muted">
                Foundation release: live URDF and PID labs, six learning modules
                and knowledge checkpoints. Advanced native-ROS labs require the
                external tools described in Field notes.
              </p>
            </section>
          )}
          {view === "control" && (
            <section className="control-lab">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">DISCRETE CONTROL / 50 HZ</div>
                  <h2>Wheel velocity response</h2>
                </div>
                <span className="subtle-badge">First-order teaching model</span>
              </div>
              <div className="control-layout">
                <div>
                  <PidPlot gains={gains} />
                  <div className="plot-legend">
                    <span className="mint-dot" /> Measured velocity{" "}
                    <span className="reference-dot" /> Setpoint: 1 rad/s
                  </div>
                </div>
                <div className="gain-controls">
                  {(["kp", "ki", "kd"] as const).map((gain) => (
                    <label key={gain}>
                      <span>
                        {gain.toUpperCase()}
                        <output>{gains[gain].toFixed(2)}</output>
                      </span>
                      <input
                        aria-label={`${gain} gain`}
                        type="range"
                        min="0"
                        max={gain === "kd" ? "0.2" : "5"}
                        step="0.01"
                        value={gains[gain]}
                        onChange={(event) =>
                          setGains({
                            ...gains,
                            [gain]: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  ))}
                  <button
                    className="secondary-button"
                    onClick={() => setGains({ kp: 2, ki: 0.8, kd: 0.05 })}
                  >
                    <RotateCcw size={14} /> Reset gains
                  </button>
                  <div className="pid-challenge">
                    <div className="eyebrow">
                      WHEEL-SPEED CHALLENGE / 150 XP
                    </div>
                    <h3>Hold the target without a surge</h3>
                    <p>
                      Finish within 5% of 1 rad/s after five seconds, with less
                      than 10% overshoot.
                    </p>
                    <dl>
                      <div>
                        <dt>Final error</dt>
                        <dd>{(pidResult.finalError * 100).toFixed(1)}%</dd>
                      </div>
                      <div>
                        <dt>Overshoot</dt>
                        <dd>{(pidResult.overshoot * 100).toFixed(1)}%</dd>
                      </div>
                    </dl>
                    <button
                      className="primary-button"
                      disabled={progress.completed.includes("pid-lab")}
                      onClick={() => {
                        if (!pidResult.passed) {
                          setNotice(
                            "Not there yet. Try increasing KI gradually to remove the remaining error, then check overshoot.",
                          );
                          return;
                        }
                        complete("pid-lab");
                        setNotice(
                          "Wheel-speed challenge complete. +150 XP! The controller meets both targets.",
                        );
                      }}
                    >
                      <Check size={15} />
                      {progress.completed.includes("pid-lab")
                        ? "Challenge complete"
                        : "Test controller"}
                    </button>
                  </div>
                  <p>
                    Plant time constant: 0.4 s. Command saturation: +/-2.
                    Integral anti-windup enabled. Derivative is taken on
                    measurement.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setLesson(curriculum[2])}
                  >
                    Read the control briefing <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>
              <Box size={12} /> ROBOQUEST{" "}
              <span className="footer-separator">/</span> Built one breakthrough
              at a time.
            </span>
            <span>
              FOUNDATION BUILD <span className="status-dot" />
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCheck size={17} />
          <span>{notice}</span>
          <button
            className="icon-button"
            title="Dismiss notification"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {lesson && (
        <Modal title={lesson.title} onClose={() => setLesson(null)}>
          <MissionLesson
            key={lesson.id}
            phase={lesson}
            available={unlocked(curriculum.indexOf(lesson))}
            complete={progress.completed.includes(lesson.id)}
            requirement={phaseRequirement(lesson.id, progress.completed)}
            onComplete={() => {
              if (phaseRequirement(lesson.id, progress.completed)) return;
              complete(lesson.id);
              setNotice(
                "Knowledge checkpoint complete. +100 XP earned on first completion.",
              );
            }}
            onLab={() => {
              setLesson(null);
              setView(lesson.id === "control" ? "control" : "garage");
              setTab("urdf");
            }}
            onNext={() => {
              const next = curriculum[curriculum.indexOf(lesson) + 1];
              setLesson(next ?? null);
              setView("tree");
            }}
          />
        </Modal>
      )}
      {celebration && (
        <Modal
          title="Rover's arm is connected"
          onClose={() => setCelebration(false)}
        >
          <div className="mission-complete">
            <Trophy size={46} />
            <div className="eyebrow">BUILD COMPLETE / +250 XP</div>
            <h3>Every link in the right place.</h3>
            <p>
              The tool now belongs to the forearm, so it follows the arm instead
              of staying on the chassis.
            </p>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => {
                  setCelebration(false);
                  setRunning(true);
                }}
              >
                Watch Rover move
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  setCelebration(false);
                  setLesson(curriculum[0]);
                }}
              >
                Continue mechanics
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        title="Connect a ROS 2 runtime"
        open={modal === "bridge"}
        onClose={() => setModal(null)}
      >
        <RosConnection onTelemetry={setTelemetry} />
      </Modal>
      {modal && modal !== "bridge" && (
        <Modal
          title={
            {
              backup: "Your journey, saved",
              resources: "Engineering field notes",
              reset: "Reset this source file?",
            }[modal]
          }
          onClose={() => setModal(null)}
        >
          {modal === "backup" && (
            <div className="connection-form">
              <p>
                {saveState}. Export a backup before clearing browser data or
                changing devices. No account or cloud subscription is needed.
              </p>
              {notice && <p role="status">{notice}</p>}
              <button className="primary-button" onClick={exportSave}>
                <ArrowDownToLine size={16} />
                Export journey
              </button>
              <label htmlFor="import-save">
                <Upload size={15} /> Import a journey backup
              </label>
              <input
                id="import-save"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  void importSave(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {pendingSave && (
                <div className="import-confirmation">
                  <p>
                    This backup has {earnedXp(pendingSave.completed)} XP.
                    Restoring it will replace this device&apos;s code and
                    milestones.
                  </p>
                  <div className="button-row">
                    <button
                      className="secondary-button"
                      onClick={() => setPendingSave(null)}
                    >
                      Cancel restore
                    </button>
                    <button className="primary-button" onClick={restoreSave}>
                      Restore journey
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {modal === "reset" && (
            <>
              <p>
                This replaces {currentFile.name} with its starter source. Earned
                milestones stay intact.
              </p>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    updateCode(initialProgress.snippets[tab]);
                    setModal(null);
                    setValidation(null);
                    if (tab === "urdf") setSource(starterUrdf);
                  }}
                >
                  <RotateCcw size={14} /> Reset source
                </button>
              </div>
            </>
          )}
          {modal === "resources" && (
            <div className="resource-list">
              {[
                {
                  title: "ROS 2 Humble documentation",
                  url: "https://docs.ros.org/en/humble/",
                  description: "Packages, communication, launch and CLI.",
                },
                {
                  title: "URDF & robot_state_publisher",
                  url: "https://docs.ros.org/en/humble/Tutorials/Intermediate/URDF/URDF-Main.html",
                  description: "Robot descriptions and transform publishing.",
                },
                {
                  title: "ros2_control",
                  url: "https://control.ros.org/humble/",
                  description: "Hardware interfaces and controller lifecycle.",
                },
                {
                  title: "Nav2",
                  url: "https://docs.nav2.org/",
                  description:
                    "Use Humble-compatible branches and configuration.",
                },
                {
                  title: "MoveIt 2",
                  url: "https://moveit.picknik.ai/humble/index.html",
                  description: "Motion planning and manipulation.",
                },
              ].map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BookOpen size={18} />
                  <span>
                    <strong>{resource.title}</strong>
                    <small>{resource.description}</small>
                  </span>
                  <ArrowRight size={15} />
                </a>
              ))}
              <p>
                The repository deployment guide covers native ROS. Browser
                Python and C++ are source files only; they are not executed by
                this page.
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Nav({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      className={active ? "active" : ""}
      onClick={onClick}
    >
      <Icon size={17} />
      <span>{label}</span>
      {badge && <small>{badge}</small>}
      {active && <span className="nav-indicator" />}
    </button>
  );
}
function Modal({
  title,
  children,
  onClose,
  open = true,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  open?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-content">
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            title="Close dialog"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
function PidPlot({ gains }: { gains: { kp: number; ki: number; kd: number } }) {
  const points = simulatePid(gains.kp, gains.ki, gains.kd);
  const path = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${50 + (point.time / 5) * 610},${280 - (point.speed / 2) * 240}`,
    )
    .join(" ");
  return (
    <svg
      className="pid-plot"
      viewBox="0 0 700 330"
      role="img"
      aria-label="Wheel speed over five seconds for selected PID gains"
    >
      {[0, 0.5, 1, 1.5, 2].map((value) => (
        <g key={value}>
          <line
            x1="50"
            x2="660"
            y1={280 - value * 120}
            y2={280 - value * 120}
            stroke="#293638"
          />
          <text x="12" y={284 - value * 120}>
            {value.toFixed(1)}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((value) => (
        <text key={value} x={47 + value * 122} y="309">
          {value}s
        </text>
      ))}
      <line
        x1="50"
        x2="660"
        y1="160"
        y2="160"
        stroke="#d7b976"
        strokeDasharray="5 6"
      />
      <path d={path} fill="none" stroke="#6de2b8" strokeWidth="3" />
      <text x="50" y="20">
        VELOCITY (rad/s)
      </text>
    </svg>
  );
}
