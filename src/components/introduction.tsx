"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  Box,
  Code2,
  Compass,
  GraduationCap,
  Wrench,
} from "lucide-react";
import { referenceUrdf } from "@/lib/robot";
import { STORAGE_KEY } from "@/lib/progress";
import styles from "./introduction.module.css";

const RobotViewer = dynamic(() => import("./robot-viewer"), { ssr: false });
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
const hasSave = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

export default function Introduction() {
  const returning = useSyncExternalStore(subscribe, hasSave, () => false);
  return (
    <div className={styles.introduction}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Box size={27} />
          RoboQuest
        </Link>
        <a href="#journey">
          The journey <ArrowRight size={14} />
        </a>
      </header>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div
            className={styles.scene}
            aria-label="Meet Rover, your mobile manipulator"
          >
            <RobotViewer
              source={referenceUrdf}
              running={false}
              frames={false}
              shoulder={0.28}
              elbow={0.9}
              resetKey={0}
            />
          </div>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>
              A FREE ROBOTICS LEARNING ADVENTURE
            </span>
            <h1>RoboQuest</h1>
            <h2>
              Your first robot.
              <br />
              Built one discovery at a time.
            </h2>
            <p>
              Meet Rover: a mobile robot with a working arm. Learn how its body,
              electronics and code fit together as you solve missions, earn XP
              and unlock the next part of your engineering journey.
            </p>
            <Link href="/play" className={styles.start}>
              {returning ? "Continue your journey" : "Start your journey"}
              <ArrowRight size={19} />
            </Link>
            <span className={styles.promise}>
              No payment. No account. Start with zero experience.
            </span>
          </div>
          <div className={styles.robotLabel}>
            <span />
            ROVER MK.01<small>YOUR ROBOT. YOUR NEXT CHALLENGE.</small>
          </div>
        </section>
        <section id="journey" className={styles.journey}>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>FROM CURIOUS TO CAPABLE</span>
            <h2>A garage, a guide, and a goal.</h2>
            <p>
              This is a learning game, not a race. Read a short briefing, try a
              challenge, and use Astra&apos;s hints whenever you get stuck.
            </p>
          </div>
          <div className={styles.steps}>
            {[
              {
                Icon: Wrench,
                title: "Build something real",
                text: "Begin with links and joints. Fix Rover's arm, then watch your changes in the 3D garage.",
              },
              {
                Icon: Code2,
                title: "Learn by trying",
                text: "Experiment with code and controls. Failed checks point to what needs work; mistakes never cost you XP.",
              },
              {
                Icon: Compass,
                title: "Unlock the next mission",
                text: "Explore six disciplines, from mechanics and electronics to ROS 2, navigation and manipulation.",
              },
            ].map(({ Icon, title, text }, index) => (
              <article key={title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className={styles.expectations}>
            <GraduationCap size={23} />
            <div>
              <h3>What you can play today</h3>
              <p>
                Interactive robot-description and control labs, mission
                briefings, and checkpoints across six phases. Advanced ROS
                exercises run on your own computer with free tools. The browser
                preview shows movement, not full physics. Your progress stays in
                this browser, and you can export a backup.
              </p>
            </div>
          </div>
        </section>
        <footer className={styles.footer}>
          <span>RoboQuest / The path to principal engineer</span>
          <Link href="/play">
            Enter the garage <ArrowRight size={14} />
          </Link>
        </footer>
      </main>
    </div>
  );
}
