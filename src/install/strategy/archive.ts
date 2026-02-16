import { existsSync } from "fs";
import { resolve } from "path";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { downloadAndExtract, extensionsCmd } from "../utils/archive";

export function isArchiveInput(input: string) {
	return Object.keys(extensionsCmd).some(ext => input.endsWith(ext));
}

export const archiveStrategy: InstallationStrategy = async (context) => {
	const { input, previousCwd: prevCwd } = context;

	let name = context.name;
	if (!name) {
		console.error("Please provide an app name");
		console.error("Usage: zhiva install <file.zip> -n <name>");
		process.exit(1);
	}

	if (!name.includes("/"))
		name = `archive/${name}`;

	chdirToApps();

	const appPath = resolve(name);

	if (existsSync(appPath))
		return { name, dir: appPath };

	await downloadAndExtract(input, prevCwd, name);

	return {
		name,
		dir: appPath,
	};
}
