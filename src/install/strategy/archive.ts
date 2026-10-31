import { existsSync } from "fs";
import { resolve } from "path";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { downloadAndExtract, extensionsCmd } from "../utils/archive";
import { red } from "../../utils/color";

export function isArchiveInput(input: string) {
	return Object.keys(extensionsCmd).some(ext => input.endsWith(ext));
}

function nameFromInput(input: string) {
	const file = input.split(/[\\/]/).pop() || "";

	for (const extension of Object.keys(extensionsCmd).sort(
		(a, b) => b.length - a.length,
	)) {
		if (file.endsWith(extension))
			return file.slice(0, -extension.length).trim();
	}

	return "";
}

export const archiveStrategy: InstallationStrategy = async context => {
	const { input, previousCwd: prevCwd } = context;

	let name = context.name || nameFromInput(input);
	if (!name || name === "." || name === "..") {
		console.error(red("Could not determine the app name from the archive."));
		console.error(
			red("Provide one explicitly: zhiva install <file.zip> -n <name>"),
		);
		process.exit(1);
	}

	if (!name.includes("/")) name = `archive/${name}`;

	chdirToApps();

	const appPath = resolve(name);

	if (existsSync(appPath))
		return {
			name,
			dir: appPath,
		};

	await downloadAndExtract(input, prevCwd, name);

	return {
		name,
		dir: appPath,
	};
};
