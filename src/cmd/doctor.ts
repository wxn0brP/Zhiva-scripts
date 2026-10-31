import {
	constants,
	accessSync,
	existsSync,
	readFileSync,
	readdirSync,
} from "fs";
import { homedir } from "os";
import { delimiter, join } from "path";
import { bold, dim, green, red, yellow } from "../utils/color";

type Status = "ok" | "warn" | "fail";

interface Check {
	name: string;
	status: Status;
	detail?: string;
	hint?: string;
}

const zhivaRoot = join(homedir(), ".zhiva");
const checks: Check[] = [];

function add(name: string, status: Status, detail?: string, hint?: string) {
	checks.push({
		name,
		status,
		detail,
		hint,
	});
}

function run(cmd: string[]) {
	try {
		const proc = Bun.spawnSync({
			cmd,
			stdout: "pipe",
			stderr: "pipe",
		});

		return {
			ok: proc.exitCode === 0,
			out: (proc.stdout?.toString() || "").trim(),
		};
	} catch {
		return {
			ok: false,
			out: "",
		};
	}
}

function pkgConfig(name: string) {
	if (!Bun.which("pkg-config")) return false;
	return run([
		"pkg-config",
		"--exists",
		name,
	]).ok;
}

function hasLibrary(name: string) {
	if (!Bun.which("ldconfig")) return false;
	return run([
		"ldconfig",
		"-p",
	]).out.includes(name);
}

function readEngineVersion() {
	const path = join(zhivaRoot, "zhiva.nv.txt");
	if (!existsSync(path)) return null;

	const value = readFileSync(path, "utf-8").trim();
	return value ? value.slice(0, 7) : null;
}

// --- bun ---
const bunInPath = Bun.which("bun");
const bunPath = bunInPath || join(homedir(), ".bun", "bin", "bun");
const [bunMajor, bunMinor] = Bun.version.split(".").map(Number);
const bunOld = bunMajor < 1 || (bunMajor === 1 && bunMinor < 1);
add(
	"bun",
	!bunInPath ? "fail" : bunOld ? "warn" : "ok",
	bunInPath
		? `${Bun.version} (${bunPath})`
		: `running on ${Bun.version}, but not found in PATH`,
	!bunInPath
		? `Install bun from https://bun.sh and add ${join(homedir(), ".bun", "bin")} to PATH`
		: bunOld
			? "Update bun with: bun upgrade"
			: undefined,
);

// --- git ---
const git = run([
	"git",
	"--version",
]);
add(
	"git",
	git.ok ? "ok" : "fail",
	git.ok ? git.out.replace("git version ", "") : "not found",
	git.ok ? undefined : "Install git with your system package manager",
);

// --- zhiva on PATH ---
const binDir = join(zhivaRoot, "bin");
const zhivaBin = Bun.which("zhiva");
const pathHasBin = (process.env.PATH || "").split(delimiter).includes(binDir);
if (zhivaBin) {
	add("zhiva on PATH", "ok", zhivaBin);
} else {
	add(
		"zhiva on PATH",
		"fail",
		"not found",
		`Add it to your shell profile:\nexport PATH="${binDir}:$PATH"`,
	);
}
if (zhivaBin && !pathHasBin) {
	add(
		"zhiva bin directory",
		"warn",
		`${binDir} is not in PATH`,
		`Desktop shortcuts may still work, but the shell needs:\nexport PATH="${binDir}:$PATH"`,
	);
}

// --- native engine ---
const enginePath = join(
	zhivaRoot,
	process.platform === "win32" ? "zhiva.exe" : "zhiva",
);
let engineOk = existsSync(enginePath);
if (engineOk && process.platform !== "win32") {
	try {
		accessSync(enginePath, constants.X_OK);
	} catch {
		engineOk = false;
	}
}
add(
	"engine",
	engineOk ? "ok" : "fail",
	engineOk ? readEngineVersion() || "installed" : `missing (${enginePath})`,
	engineOk ? undefined : "Run: zhiva self",
);

// --- base-lib ---
const baseLibPath = join(
	zhivaRoot,
	"node_modules",
	"@wxn0brp",
	"zhiva-base-lib",
);
add(
	"base-lib",
	existsSync(baseLibPath) ? "ok" : "fail",
	existsSync(baseLibPath) ? baseLibPath : "not installed",
	existsSync(baseLibPath) ? undefined : "Run: zhiva self",
);

// --- database ---
const dbPath = join(zhivaRoot, "master.db");
let dbDetail = "not created yet";
let dbStatus: Status = "warn";
if (existsSync(dbPath)) {
	try {
		dbDetail = `${readdirSync(dbPath).length} collection(s)`;
		dbStatus = "ok";
	} catch {
		dbDetail = `${dbPath} is not readable`;
		dbStatus = "fail";
	}
}
add(
	"database",
	dbStatus,
	dbDetail,
	dbStatus === "fail" ? `Check permissions on ${dbPath}` : undefined,
);

// --- platform specific ---
if (process.platform === "linux") {
	const webkit =
		pkgConfig("webkit2gtk-4.1") ||
		pkgConfig("webkit2gtk-4.0") ||
		hasLibrary("libwebkit2gtk-4.1") ||
		hasLibrary("libwebkit2gtk-4.0");
	add(
		"webkit2gtk",
		webkit ? "ok" : "fail",
		webkit ? "found" : "not found",
		webkit
			? undefined
			: "Debian/Ubuntu: sudo apt install libwebkit2gtk-4.1-0\nFedora: sudo dnf install webkit2gtk4.1\nArch: sudo pacman -S webkit2gtk-4.1\nopenSUSE: sudo zypper install libwebkit2gtk-4_1-0",
	);

	const gtk = pkgConfig("gtk+-3.0") || hasLibrary("libgtk-3");
	add(
		"gtk3",
		gtk ? "ok" : "warn",
		gtk ? "found" : "not found",
		gtk ? undefined : "Install the GTK 3 runtime for your distribution",
	);

	const missingXdg = [
		"xdg-open",
		"xdg-mime",
		"xdg-user-dir",
	].filter(cmd => !Bun.which(cmd));
	add(
		"xdg-utils",
		missingXdg.length ? "warn" : "ok",
		missingXdg.length ? `missing: ${missingXdg.join(", ")}` : "found",
		missingXdg.length
			? "Desktop shortcuts and the zhiva:// protocol need xdg-utils"
			: undefined,
	);

	const handler = run([
		"xdg-mime",
		"query",
		"default",
		"x-scheme-handler/zhiva",
	]).out;
	add(
		"protocol handler",
		handler ? "ok" : "warn",
		handler || "not registered",
		handler
			? undefined
			: "Re-run the installer or: xdg-mime default zhiva-protocol.desktop x-scheme-handler/zhiva",
	);
} else if (process.platform === "darwin") {
	add(
		"platform",
		"warn",
		"macOS support is untested",
		"Windows and Linux are the supported platforms",
	);
} else if (process.platform === "win32") {
	add(
		"platform",
		"warn",
		"Windows requires the WebView2 runtime",
		"It is included in Windows 11 and most Windows 10 installs",
	);
}

// --- report ---
const labels: Record<Status, string> = {
	ok: green(" ok "),
	warn: yellow("warn"),
	fail: red("FAIL"),
};

console.log(
	`${bold("Zhiva doctor")} ${dim(`(${process.platform} ${process.arch})`)}`,
);
console.log(`${dim("root:")} ${zhivaRoot}`);
console.log("");

for (const check of checks) {
	const detail = check.detail
		? `: ${
				check.status === "fail"
					? red(check.detail)
					: check.status === "warn"
						? yellow(check.detail)
						: dim(check.detail)
			}`
		: "";
	console.log(`[${labels[check.status]}] ${bold(check.name)}${detail}`);
	if (!check.hint) continue;

	for (const line of check.hint.split("\n")) {
		console.log(`         ${dim(line)}`);
	}
}

const failures = checks.filter(check => check.status === "fail").length;
const warnings = checks.filter(check => check.status === "warn").length;
const passed = checks.length - failures - warnings;

const summary = `${passed} ok, ${warnings} warning(s), ${failures} failure(s)`;
console.log("");
console.log(
	failures ? red(summary) : warnings ? yellow(summary) : green(summary),
);
if (failures) process.exit(1);

export default () => {};
