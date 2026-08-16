import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { findpath } from "nw";

const projectRoot = path.resolve(process.cwd());
const mode = process.argv[2];

if (mode !== "development" && mode !== "production") {
  console.error("Usage: node scripts/run-nw.js <development|production>");
  process.exit(1);
}

const nwExecutable = await findpath();

const nwArgs = [];

if (mode === "development") {
  nwArgs.push(`--user-data-dir=${path.join(projectRoot, ".nw-local-data")}`);
}

nwArgs.push(projectRoot, mode);

const child = spawn(nwExecutable, nwArgs, {
  cwd: projectRoot,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Failed to start NW.js:", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
