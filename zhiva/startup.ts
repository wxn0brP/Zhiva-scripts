#!/usr/bin/env bun

import { $ } from "bun";
import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

function boolArgument(name: string) {
    const index = process.argv.indexOf(name);
    if (index === -1) return 0;
    process.argv.splice(index, 1);
    return index;
}

// --- Args ---
let skipEngine = boolArgument("--skip-engine");
let skipBaseLib = boolArgument("--skip-base-lib");
if (boolArgument("-run")) {
    skipEngine = 1;
    skipBaseLib = 1;
}

// --- Paths ---
const HOME = process.env.HOME ?? process.env.USERPROFILE;
const zhivaPath = join(HOME, ".zhiva");
if (!existsSync(zhivaPath)) mkdirSync(zhivaPath, { recursive: true });
process.chdir(zhivaPath);

const platform = process.platform;

// --- Engine / base-lib ---
async function checkEngine() {
    const baseLink = "https://github.com/wxn0brP/Zhiva-native/releases/download/native/";
    const nv = "zhiva.nv.txt";

    try {
        const serverVersion = await fetch(baseLink + nv).then(res => res.text());
        if (existsSync(nv) && readFileSync(nv, "utf-8").trim() === serverVersion.trim()) {
            return console.log("Zhiva is up to date");
        }

        console.log("Downloading Zhiva...");
        await $`curl -L ${baseLink}zhiva-${platform} -o zhiva`;
        writeFileSync(nv, serverVersion);
        if (platform !== "win32") await $`chmod +x zhiva`;
    } catch (e) {
        console.error("Error downloading/updating Zhiva:", e);
        if (!existsSync("zhiva")) process.exit(1);
    }
}

if (!skipEngine) await checkEngine();
if (!skipBaseLib) {
    if (existsSync("node_modules/@wxn0brp/zhiva-base-lib")) {
        process.chdir("node_modules/@wxn0brp/zhiva-base-lib");
        try {
            await $`git pull`;
            await $`bun install`;
        } catch { }
        process.chdir("../../..");
    } else {
        await $`mkdir -p node_modules`;
        await $`git clone https://github.com/wxn0brP/Zhiva-base-lib.git node_modules/@wxn0brp/zhiva-base-lib`;
    }
}

// --- App ---
const appName = process.argv[2];
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