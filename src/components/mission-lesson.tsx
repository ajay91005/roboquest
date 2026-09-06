"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  FlaskConical,
  Trophy,
} from "lucide-react";
import type { Phase } from "@/lib/curriculum";
import { decisions } from "@/lib/game";

export default function MissionLesson({
  phase,
  complete,
  available,
  requirement,
  onComplete,
  onLab,
  onNext,
}: {
  phase: Phase;
  complete: boolean;
  available: boolean;
  requirement: string;
  onComplete: () => void;
  onLab: () => void;
  onNext: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState<string[]>([]);
  const challenges = [
    ...decisions[phase.id],
    {
      question: phase.question,
      options: phase.answers,
      answer: phase.correct,
      explanation:
        "That's the right engineering choice. Carry that reasoning into the next build.",
    },
  ];
  const reading = step < phase.topics.length;
  const decisionIndex = step - phase.topics.length;
  const topic = phase.topics[step];
  const challenge = challenges[decisionIndex];
  const total = phase.topics.length + challenges.length;
  const correct = challenge && answer === challenge.answer;
  const move = (next: number) => {
    setStep(next);
    setAnswer(null);
    setChecked(false);
  };
  const allSolved = solved.length === challenges.length;

  if (complete)
    return (
      <div className="mission-complete">
        <Trophy size={42} />
        <div className="eyebrow">MISSION COMPLETE / 100 XP</div>
        <h3>{phase.title}</h3>
        <p>
          You worked through the briefing and made the key engineering
          decisions. Your progress is saved on this device.
        </p>
        <div className="button-row">
          <button className="primary-button" onClick={onNext}>
            {phase.id === "autonomy" ? "See your journey" : "Next mission"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );

  return (
    <div className="lesson-content guided-lesson">
      <div className="mission-progress">
        <span>
          PHASE {phase.number} / {reading ? "BRIEFING" : "ENGINEERING DECISION"}
        </span>
        <span>
          {step + 1} / {total}
        </span>
      </div>
      <progress aria-label="Mission progress" max={total} value={step + 1} />
      {reading ? (
        <section>
          <h3>{topic.title}</h3>
          <p>{topic.body}</p>
          <div className="lab-prompt">
            <FlaskConical size={18} />
            <p>{topic.lab}</p>
          </div>
        </section>
      ) : (
        <section className="checkpoint">
          <h3>{challenge.question}</h3>
          <fieldset>
            <legend className="sr-only">Choose an answer</legend>
            {challenge.options.map((option, index) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`decision-${phase.id}-${decisionIndex}`}
                  checked={answer === index}
                  onChange={() => {
                    setAnswer(index);
                    setChecked(false);
                  }}
                />
                {option}
              </label>
            ))}
          </fieldset>
          <button
            className="secondary-button"
            disabled={answer === null}
            onClick={() => {
              setChecked(true);
              if (correct)
                setSolved((previous) => [
                  ...new Set([...previous, challenge.question]),
                ]);
            }}
          >
            <Check size={15} />
            Check answer
          </button>
          {checked && (
            <p
              role="status"
              className={correct ? "success-text" : "error-text"}
            >
              {correct
                ? challenge.explanation
                : "Not quite. Think about the physical behavior or system responsibility, then try again. You don't lose XP."}
            </p>
          )}
        </section>
      )}
      {requirement && (
        <div className="lab-prompt">
          <Code2 size={18} />
          <div>
            <p>{requirement}</p>
            <button className="text-button" onClick={onLab}>
              Open practical lab <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
      <div className="mission-navigation">
        <button
          className="secondary-button"
          disabled={step === 0}
          onClick={() => move(step - 1)}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        {step < total - 1 ? (
          <button
            className="primary-button"
            disabled={!reading && !solved.includes(challenge.question)}
            onClick={() => move(step + 1)}
          >
            {reading && step === phase.topics.length - 1
              ? "Try the decisions"
              : "Continue"}
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={!allSolved || !!requirement || !available}
            onClick={onComplete}
          >
            <Trophy size={15} />
            Complete mission
          </button>
        )}
      </div>
    </div>
  );
}
