"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import URDFLoader, { URDFRobot } from "urdf-loader";

export type ViewerProps = {
  source: string;
  running: boolean;
  frames: boolean;
  shoulder: number;
  elbow: number;
  resetKey: number;
  telemetry?: Record<string, number>;
};

export default function RobotViewer(props: ViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const robot = useRef<URDFRobot | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const latest = useRef(props);
  const [error, setError] = useState("");
  useEffect(() => {
    latest.current = props;
  }, [props]);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      setError(
        "WebGL is unavailable. Enable hardware acceleration to view the robot.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x111a1c, 1);
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D mobile manipulator",
    );
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 50);
    camera.up.set(0, 0, 1);
    camera.position.set(1.65, -2.2, 1.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0.48);
    controls.enableDamping = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.saveState();
    controlsRef.current = controls;
    scene.add(new THREE.HemisphereLight(0xe5fff7, 0x283c40, 3));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(2, -3, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    scene.add(light);
    const fill = new THREE.DirectionalLight(0x5edac9, 2);
    fill.position.set(-3, 1, 2);
    scene.add(fill);
    const grid = new THREE.GridHelper(12, 60, 0x354a4b, 0x223234);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.008;
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.25 }),
    );
    floor.receiveShadow = true;
    floor.position.z = -0.006;
    scene.add(floor);
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resize.observe(container);
    let elapsed = 0;
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const state = latest.current;
      if (state.running) elapsed += delta;
      if (robot.current) {
        robot.current.setJointValues(
          state.telemetry ?? {
            shoulder_joint:
              state.shoulder +
              (state.running ? Math.sin(elapsed * 0.7) * 0.2 : 0),
            elbow_joint:
              state.elbow +
              (state.running ? Math.sin(elapsed * 0.7 + 0.5) * 0.25 : 0),
            left_wheel_joint: elapsed * 0.65,
            right_wheel_joint: elapsed * 0.65,
          },
        );
        robot.current.traverse((object) => {
          if (object instanceof THREE.AxesHelper) object.visible = state.frames;
        });
      }
      controls.update();
      renderer.render(scene, camera);
    });
    return () => {
      renderer.setAnimationLoop(null);
      resize.disconnect();
      controls.dispose();
      dispose(scene);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    try {
      const loader = new URDFLoader();
      loader.loadMeshCb = (_url, _manager, _material, done) =>
        done(new THREE.Object3D(), new Error("External meshes disabled"));
      const next = loader.parse(props.source);
      if (robot.current) {
        scene.remove(robot.current);
        dispose(robot.current);
      }
      next.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      for (const name of ["base_link", "forearm", "tool0", "lidar_link"]) {
        if (next.links[name]) next.links[name].add(new THREE.AxesHelper(0.16));
      }
      robot.current = next;
      scene.add(next);
      setError("");
    } catch {
      setError(
        "The robot could not be rendered. Check the URDF and build again.",
      );
    }
  }, [props.source]);

  useEffect(() => {
    controlsRef.current?.reset();
  }, [props.resetKey]);
  return (
    <div ref={host} className="robot-canvas">
      {error && (
        <div role="alert" className="viewer-error">
          {error}
        </div>
      )}
    </div>
  );
}

function dispose(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
}
