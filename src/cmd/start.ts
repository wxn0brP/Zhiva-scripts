import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { delimiter, isAbsolute, join, resolve } from "path";
import { parseArgs } from "util";
import { ensureAppName } from "../utils/appName";
import { guessApp } from "../utils/guess";
import { interactiveAppSelect } from "../utils/select";

// --- Args ---
const { values, positionals } = parseArgs({
    options: {
        help: { type: "boolean", short: "h" },
        engine: { type: "string", short: "e" },
        deps: { type: "string", short: "d" },
    },
    allowPositionals: true,
});

if (values.help) {
    console.log(`[Z-SCR-2-01]
Usage: zhiva run [options] <app-name>

Options:
  -h, --help            Show this help message
  -e, --engine <mode>   Update Zhiva engine (default: 0)
  -d, --deps <mode>     Update Zhiva dependencies (default: 0)

Mode:
  0 = auto
  1 = skip
  2 = force
`.trimStart());
    process.exit(0);
}

// --- Paths ---
const originalPath = process.cwd();
const HOME = homedir();
const zhivaPath = join(HOME, ".zhiva");
if (!existsSync(zhivaPath)) mkdirSync(zhivaPath, { recursive: true });
process.chdir(zhivaPath);

const latestCheck = existsSync("latest-check")
    ? (+readFileSync("latest-check", "utf-8") || 0)
    : 0;
let lastCheckWrite = false;
const HOUR = 60 * 60 * 1000;

function shouldCheck(mode: number, last: number) {
    if (mode === 1) return false; // skip
    if (mode === 2) return true;  // force
    return Date.now() - last > HOUR; // auto (if > 1h)
}

async function handleComponent(name: string) {
    const mode = parseInt(values[name] ?? "0", 10);
    const doCheck = shouldCheck(mode, latestCheck);

    if (!doCheck) {
        console.log(`[Z-SCR-2-02] [${name}] skipped (mode ${mode})`);
        return;
    }

    console.log(`[Z-SCR-2-03] [${name}] updating (mode ${mode})...`);
    await import("../utils/" + name);

    if (lastCheckWrite) return;
    lastCheckWrite = true;
    writeFileSync("latest-check", String(Date.now()));
}

// --- Update ---
await handleComponent("engine");
await handleComponent("deps");

// --- App ---
let appName = positionals[1];
if (appName === "init") {
    console.log("[Z-SCR-2-04] 💜 Init completed");
    process.exit(0);
}

if (!appName) {
    console.error("Please provide an app name");
    process.exit(1);
}

let appPath = "";
if (isAbsolute(appName)) appPath = appName;
else if (appName === ".") appPath = originalPath;
else {
    appName = ensureAppName(appName);
    appPath = join(zhivaPath, "apps", appName);
}

if (!existsSync(appPath)) {
    const appNameOnly = appName.includes("/") ? appName.split("/")[1] : appName;
    const suggestions = await guessApp(appNameOnly);

    if (suggestions.length > 0) {
        const selectedApp = await interactiveAppSelect(suggestions);
        if (selectedApp && selectedApp !== "Cancel") {
            appName = ensureAppName(selectedApp);
            appPath = join(zhivaPath, "apps", appName);

            if (!existsSync(appPath)) {
                console.error(`[Z-SCR-2-07] Selected app '${appName}' could not be found.`);
                process.exit(1);
            }
            console.log(`Starting selected app: ${appName}`);
        } else {
            process.exit(1);
        }
    } else {
        console.error(`App ${appName} does not exist`);
        process.exit(1);
    }
}

process.chdir(appPath);

async function start() {
    // --- STATIC APPS ---
    if (existsSync("zhiva.json")) {
        const config = JSON.parse(readFileSync("zhiva.json", "utf-8"));
        if (config.static) {
            await import("../utils/static");
            return;
        }
    }

    // --- NODE_PATH ---
    const nodePath = [
        resolve(appPath, "node_modules"),
        resolve(zhivaPath, "node_modules")
    ].join(delimiter);

    process.env.PATH = `${process.env.PATH}${delimiter}${join(HOME, ".bun/bin")}`;

    // --- Run Bun ---
    const bun = spawn(
        "bun",
        ["run", "start"],
        {
            stdio: "inherit",
            env: {
                ...process.env,
                ZHIVA_ROOT: zhivaPath,
                NODE_PATH: nodePath
            }
        }
    );

    bun.on("exit", code => process.exit(code ?? 1));
    bun.on("error", err => {
        console.error("Failed to start Bun:", err);
        process.exit(1);
    });
}

start();
export default () => { }