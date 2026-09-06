"use client";
import { useEffect, useState } from "react";
import Editor, { loader, type EditorProps } from "@monaco-editor/react";

declare global {
  interface Window {
    roboMonaco?: typeof import("monaco-editor");
    MonacoEnvironment?: { getWorkerUrl: () => string };
  }
}

let editorReady: Promise<void> | undefined;
function loadEditor() {
  if (!editorReady)
    editorReady = new Promise<void>((resolve, reject) => {
      window.MonacoEnvironment = {
        getWorkerUrl: () => "/monaco/editor.worker.js",
      };
      const script = document.createElement("script");
      script.src = "/monaco/editor.js";
      script.onload = () => {
        if (!window.roboMonaco) {
          editorReady = undefined;
          reject(new Error("Editor bundle unavailable"));
          return;
        }
        loader.config({ monaco: window.roboMonaco });
        resolve();
      };
      script.onerror = () => {
        editorReady = undefined;
        script.remove();
        reject(new Error("Editor bundle unavailable"));
      };
      document.head.appendChild(script);
    });
  return editorReady;
}

export default function CodeEditor(props: EditorProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    loadEditor()
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  if (failed)
    return (
      <textarea
        className="fallback-editor"
        aria-label="Source code fallback"
        value={props.value}
        onChange={(event) =>
          props.onChange?.(
            event.target.value,
            {} as import("monaco-editor").editor.IModelContentChangedEvent,
          )
        }
      />
    );
  return ready ? (
    <Editor {...props} />
  ) : (
    <div className="editor-loading">Loading editor...</div>
  );
}
