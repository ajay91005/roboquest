import { build } from "esbuild";
import { resolve } from "node:path";

const sanitizerPlugin = {
  name: "patched-sanitizer",
  setup(builder) {
    builder.onResolve({ filter: /dompurify\/dompurify\.js$/ }, () => ({
      path: resolve("node_modules/dompurify/dist/purify.es.mjs"),
    }));
  },
};
await build({
  stdin: {
    contents: `export * from 'monaco-editor/editor/editor.api.js';
    import 'monaco-editor/languages/definitions/xml/register.js';
    import 'monaco-editor/languages/definitions/python/register.js';
    import 'monaco-editor/languages/definitions/cpp/register.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "roboMonaco",
  outfile: "public/monaco/editor.js",
  loader: { ".ttf": "file" },
  plugins: [sanitizerPlugin],
  legalComments: "linked",
  logLevel: "info",
});
await build({
  entryPoints: ["monaco-editor/editor/editor.worker.js"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "public/monaco/editor.worker.js",
  legalComments: "linked",
  logLevel: "info",
});
