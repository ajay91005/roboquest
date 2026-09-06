"use client";
import { useEffect, useRef, useState } from "react";
import { PlugZap, Unplug } from "lucide-react";
import { Ros, Topic } from "roslib";

export default function RosConnection({
  onTelemetry,
}: {
  onTelemetry: (values: Record<string, number> | undefined) => void;
}) {
  const [url, setUrl] = useState("ws://localhost:7860");
  const [status, setStatus] = useState("Disconnected");
  const connection = useRef<Ros | null>(null);
  const subscription = useRef<Topic | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onTelemetry);
  useEffect(() => {
    callback.current = onTelemetry;
  }, [onTelemetry]);
  useEffect(
    () => () => {
      clearTimeout(watchdog.current);
      subscription.current?.unsubscribe();
      connection.current?.close();
      callback.current(undefined);
    },
    [],
  );
  function disconnect() {
    clearTimeout(watchdog.current);
    subscription.current?.unsubscribe();
    connection.current?.close();
    connection.current = null;
    callback.current(undefined);
    setStatus("Disconnected");
  }
  function connect() {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setStatus("Enter a valid WebSocket URL");
      return;
    }
    if (
      !["ws:", "wss:"].includes(parsed.protocol) ||
      (location.protocol === "https:" && parsed.protocol !== "wss:")
    ) {
      setStatus("HTTPS pages require a secure wss:// bridge");
      return;
    }
    disconnect();
    const ros = new Ros({ url });
    connection.current = ros;
    setStatus("Connecting...");
    ros.on("connection", () => {
      if (connection.current !== ros) return;
      setStatus("Connected: /joint_states");
      const topic = new Topic({
        ros,
        name: "/joint_states",
        messageType: "sensor_msgs/JointState",
        throttle_rate: 50,
      });
      subscription.current = topic;
      topic.subscribe((message: unknown) => {
        const data = message as { name?: unknown; position?: unknown };
        if (connection.current !== ros) return;
        if (!Array.isArray(data.name) || !Array.isArray(data.position)) return;
        const positions = data.position;
        const values: Record<string, number> = {};
        data.name.forEach((name, index) => {
          if (
            typeof name === "string" &&
            typeof positions[index] === "number" &&
            Number.isFinite(positions[index])
          )
            values[name] = positions[index];
        });
        callback.current(values);
        setStatus("Connected: /joint_states");
        clearTimeout(watchdog.current);
        watchdog.current = setTimeout(() => {
          callback.current(undefined);
          setStatus("Connected, but joint telemetry is stale");
        }, 3000);
      });
    });
    ros.on("error", () => {
      if (connection.current === ros) {
        setStatus("Bridge unavailable. Check URL and access policy.");
        callback.current(undefined);
      }
    });
    ros.on("close", () => {
      if (connection.current === ros) {
        clearTimeout(watchdog.current);
        setStatus("Disconnected");
        callback.current(undefined);
      }
    });
  }
  return (
    <div className="connection-form">
      <label htmlFor="bridge-url">ROSBRIDGE ENDPOINT</label>
      <input
        id="bridge-url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="ws://localhost:7860"
      />
      <div className="button-row">
        <button className="primary-button" onClick={connect}>
          <PlugZap size={15} /> Connect
        </button>
        <button className="secondary-button" onClick={disconnect}>
          <Unplug size={15} /> Disconnect
        </button>
      </div>
      <p role="status">{status}</p>
      <p className="muted">
        Read-only joint telemetry. Your bridge must serve the same robot
        description. No code or actuator commands are sent. For a local runtime,
        run the game locally too. HTTPS-hosted pages need a secure wss://
        endpoint.
      </p>
    </div>
  );
}
