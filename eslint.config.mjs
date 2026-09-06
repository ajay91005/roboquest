import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/dashboard.tsx", "src/components/robot-viewer.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/monaco/**",
    "test-results/**",
    "playwright-report/**",
    "backend/ros2_ws/build/**",
    "backend/ros2_ws/install/**",
  ]),
]);

export default eslintConfig;
