#!/usr/bin/env bun

import { spawn } from "bun";

if (process.argv.length < 3) {
    console.log("[Z-SCR-9-01] Usage: zhiva protocol <url>");
    process.exit(1);
}

let arg = process.argv[2];
if (!arg.startsWith("zhiva://")) {
    console.error("[Z-SCR-9-02] Invalid protocol");
    process.exit(1);
}

const args = arg.slice("zhiva://".length).split("/");

console.log(`[Z-SCR-9-03] 💜 Executing ${args.join(" ")}...`);
process.argv.splice(2, 1);

const supportedCommands = ["start", "install", "open"];
if (!supportedCommands.includes(args[0])) {
    console.error("Invalid command");
    process.exit(1);
}

const spawnArgs = [
    process.argv[0],
    "run",
    process.argv[1],
    ...args
]

spawn(spawnArgs);