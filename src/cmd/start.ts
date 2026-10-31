import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { basename, delimiter, isAbsolute, join, resolve } from "path";
import { parseArgs } from "util";
import { ensureAppName, normalizeAppId } from "../utils/appName";
import { db } from "../utils/db";
import { guessApp } from "../utils/guess";
import { interactiveAppSelect } from "../utils/select";
import { cyan, dim, green, red, bold } from "../utils/color";

// --- Args ---
const { values, positionals } = parseArgs({
	options: {
		help: {
			type: "boolean",
			short: "h",
		},
		engine: {
			type: "string",
			short: "e",
		},
		deps: {
			type: "string",
			short: "d",
		},
		update: {
			type: "boolean",
			short: "u",
		},
	},
	allowPositionals: true,
});

if (values.help) {
	console.log(
		`${dim("[Z-SCR-2-01]")}
${bold("Usage:")} zhiva run [options] <app-name>

${bold("Options:")}
  ${cyan("-h, --help")}            Show this help message
  ${cyan("-e, --engine <mode>")}   Update Zhiva engine (default: 0)
  ${cyan("-d, --deps <mode>")}     Update Zhiva dependencies (default: 0)
  ${cyan("-u, --update")}          Force engine and dependencies update

${bold("Mode:")}
  0 = auto (at most once per hour)
  1 = skip
  2 = force
`.trimStart(),
	);
	process.exit(0);
}

// --- Paths ---
const originalPath = process.cwd();
const HOME = homedir();
const zhivaPath = join(HOME, ".zhiva");
if (!existsSync(zhivaPath))
	mkdirSync(zhivaPath, {
		recursive: true,
	});
process.chdir(zhivaPath);

const latestCheck = existsSync("latest-check")
	? +readFileSync("latest-check", "utf-8") || 0
	: 0;
let lastCheckWrite = false;
const HOUR = 60 * 60 * 1000;

function shouldCheck(mode: number, last: number) {
	if (mode === 1) return false; // skip
	if (mode === 2) return true; // force
	return Date.now() - last > HOUR; // auto (if > 1h)
}

async function handleComponent(name: string) {
	let mode = 0;
	const raw = values[name];

	if (raw !== undefined) {
		mode = Number(raw);
	} else if (values.update) {
		mode = 2;
	} else {
		const data = await db.pref.findOne({
			_id: name,
		});
		if (data?.v !== undefined) mode = +data.v;
	}

	if (
		![
			0,
			1,
			2,
		].includes(mode)
	) {
		console.error(
			red(
				`Invalid --${name} mode: ${raw}. Use 0 (auto), 1 (skip) or 2 (force).`,
			),
		);
		process.exit(1);
	}

	const doCheck = shouldCheck(mode, latestCheck);

	if (!doCheck) {
		console.log(dim(`[Z-SCR-2-02] [${name}] skipped (mode ${mode})`));
		return;
	}

	console.log(cyan(`[Z-SCR-2-03] [${name}] updating (mode ${mode})...`));
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
	console.log(green("[Z-SCR-2-04] 💜 Init completed"));
	process.exit(0);
}

if (!appName) {
	const apps = await db.apps.find();
	const appNames = apps.map((app: any) => app.name);
	appName = await interactiveAppSelect(appNames);
	if (appName === "Cancel") process.exit(1);
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
				console.error(
					red(`[Z-SCR-2-07] Selected app '${appName}' could not be found.`),
				);
				process.exit(1);
			}
			console.log(`${dim("Starting selected app:")} ${cyan(appName)}`);
		} else {
			process.exit(1);
		}
	} else {
		console.error(red(`App ${appName} does not exist`));
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

		if (config.url) {
			const mod = await import("./open");
			mod.default([
				config.url,
			]);
			return;
		}
	}

	// --- NODE_PATH ---
	const nodePath = [
		resolve(appPath, "node_modules"),
		resolve(zhivaPath, "node_modules"),
	].join(delimiter);

	process.env.PATH = `${process.env.PATH}${delimiter}${join(HOME, ".bun/bin")}`;

	const appId =
		isAbsolute(appName) || appName === "."
			? basename(appPath) + ".zhiva.dev.app.local"
			: appName;

	// --- Run Bun ---
	const bun = spawn(
		"bun",
		[
			"run",
			"start",
		],
		{
			stdio: "inherit",
			env: {
				...process.env,
				ZHIVA_ROOT: zhivaPath,
				ZHIVA_APP_ID: normalizeAppId(appId),
				NODE_PATH: nodePath,
			},
		},
	);

	bun.on("exit", code => process.exit(code ?? 1));
	bun.on("error", err => {
		console.error(red("Failed to start Bun:"), err);
		process.exit(1);
	});

	if (process.platform === "win32") {
		import("../utils/hide").then(m => m.hideWindowsConsole());
	}
}

start();
export default () => {};
