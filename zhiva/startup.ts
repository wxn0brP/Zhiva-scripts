#!/usr/bin/env bun

import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";

function boolArgument(name: string) {
    const index = process.argv.indexOf(name);
    if (index === -1) return 0;
    process.argv.splice(index, 1);
    return index;
}

// --- Args ---
let skipEngine = boolArgument("--skip-engine");
let skipDepsLib = boolArgument("--skip-deps-lib");
if (boolArgument("-run")) {
    skipEngine = 1;
    skipDepsLib = 1;
}

// --- Paths ---
const HOME = process.env.HOME ?? process.env.USERPROFILE;
const zhivaPath = join(HOME, ".zhiva");
if (!existsSync(zhivaPath)) mkdirSync(zhivaPath, { recursive: true });
process.chdir(zhivaPath);

// --- Engine / base-lib ---
if (!skipEngine) await import("./engine");
if (!skipDepsLib) await import("./deps");

// --- App ---
const appName = process.argv[2];
if (appName === "init") {
    console.log("💜 Init completed");
    process.exit(0);
}

if (!appName) {
    console.error("Please provide an app name");
    process.exit(1);
}

const appPath = join(zhivaPath, "apps", appName);
if (!existsSync(appPath)) {
    console.error(`App ${appName} does not exist`);
    process.exit(1);
}
process.chdir(appPath);

// --- NODE_PATH ---
const nodePath = [
    resolve(appPath, "node_modules"),
    resolve(zhivaPath, "node_modules")
].join(":");

// --- Run Bun ---
const bun = spawn(
    "bun",
    ["run", "start"],
    {
        stdio: "inherit",
        env: {
            ...process.env,
            NODE_PATH: nodePath
        }
    }
);

bun.on("exit", code => process.exit(code ?? 1));
bun.on("error", err => {
    console.error("Failed to start Bun:", err);
    process.exit(1);
});