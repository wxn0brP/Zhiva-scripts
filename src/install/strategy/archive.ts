import { existsSync } from "fs";
import { parse, resolve } from "path";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { downloadAndExtract, extensionsCmd } from "../utils/archive";

export function isArchiveInput(input: string) {
	return Object.keys(extensionsCmd).some(ext => input.endsWith(ext));
}

export const archiveStrategy: InstallationStrategy = async (context) => {
	const { input, previousCwd: prevCwd } = context;
	let name = "archive/" + parse(input).name;

	chdirToApps();

	const appPath = resolve(name);

	if (existsSync(appPath))
		return { name, dir: appPath };

	name = "archive/" + await downloadAndExtract(input, prevCwd);

	return {
		name,
		dir: appPath,
	};
}
