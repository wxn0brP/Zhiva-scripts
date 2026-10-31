import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";
import { bold, cyan, dim } from "../utils/color";

const zhivaRoot = join(homedir(), ".zhiva");
const cliDir = resolve(join(import.meta.dir, ".."));

function readPackageVersion(dir: string) {
	const path = join(dir, "package.json");
	if (!existsSync(path)) return null;

	try {
		const pkg = JSON.parse(readFileSync(path, "utf-8"));
		return typeof pkg.version === "string" ? pkg.version : null;
	} catch {
		return null;
	}
}

function readCommit(dir: string) {
	if (!existsSync(join(dir, ".git"))) return null;

	const proc = Bun.spawnSync({
		cmd: [
			"git",
			"-C",
			dir,
			"rev-parse",
			"--short",
			"HEAD",
		],
		stdout: "pipe",
		stderr: "ignore",
	});

	if (proc.exitCode !== 0) return null;
	return proc.stdout.toString().trim() || null;
}

function readEngineVersion() {
	const path = join(zhivaRoot, "zhiva.nv.txt");
	if (!existsSync(path)) return null;

	const value = readFileSync(path, "utf-8").trim();
	return value ? value.slice(0, 7) : null;
}

export default (args: string[]) => {
	const json = args.includes("--json");
	const info = {
		cli: {
			version: readPackageVersion(cliDir),
			commit: readCommit(cliDir) || readCommit(join(zhivaRoot, "scripts")),
			path: cliDir,
		},
		engine: readEngineVersion(),
		bun: Bun.version,
		platform: `${process.platform} ${process.arch}`,
		root: zhivaRoot,
	};

	if (json) {
		console.log(JSON.stringify(info, null, 2));
		return;
	}

	console.log(
		`${bold("zhiva")} ${info.cli.version || info.cli.commit || "unknown"}`,
	);
	console.log(`  ${dim("path")}      ${info.cli.path}`);
	console.log(`  ${dim("engine")}    ${info.engine || "not installed"}`);
	console.log(`  ${dim("bun")}       ${info.bun} (${info.platform})`);
	console.log(`  ${dim("root")}      ${cyan(info.root)}`);
};
