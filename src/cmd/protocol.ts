import { spawn } from "bun";
import { delimiter, dirname } from "path";
import { cyan, red, yellow } from "../utils/color";

export default async (args: string[]) => {
	if (!args.length) {
		console.log(yellow("[Z-SCR-9-01] Usage: zhiva protocol <url>"));
		process.exit(1);
	}

	const rawArg = args[0];
	if (!rawArg.startsWith("zhiva://")) {
		console.error(red("[Z-SCR-9-02] Invalid protocol"));
		process.exit(1);
	}

	let [command, ...urlArgs] = rawArg.slice("zhiva://".length).split("/");
	const arg = urlArgs.join("/");

	console.log(cyan(`[Z-SCR-9-03] 💜 Executing ${command} ${arg}...`));
	process.argv.splice(2, 1);

	const supportedCommands = [
		"start",
		"install",
		"open",
		"install+start",
	];
	if (!supportedCommands.includes(command)) {
		console.error(red("Invalid command"));
		process.exit(1);
	}

	const bunDir = dirname(process.argv[0]);
	process.env.PATH = `${process.env.PATH}${delimiter}${bunDir}`;

	if (command === "install+start") {
		const proc = spawnZhiva("install", arg);
		await proc.exited;
		if (proc.exitCode !== 0) process.exit(proc.exitCode);
		command = "start";
	}

	spawnZhiva(command, arg);
};

function spawnZhiva(command: string, arg: string) {
	const spawnArgs = [
		process.argv[0],
		"run",
		process.argv[1],
		command,
		arg,
	];

	console.log(cyan(`[Z-SRC-9-04] 💜 Executing`), spawnArgs);
	return spawn(spawnArgs, {
		env: process.env,
		stdout: "inherit",
		stderr: "inherit",
	});
}
