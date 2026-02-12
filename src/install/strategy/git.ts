import { $ } from "bun";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import { join, resolve } from "path";
import { ensureAppName } from "../../utils/appName";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { clone } from "../utils/git";

export function isHttpGitInput(input: string) {
	return input.startsWith("http");
}

export const httpGitStrategy: InstallationStrategy = async (context) => {
	const { input } = context;
	let name = ensureAppName(input);

	chdirToApps();

	const split = input.split("#"); // name # branch
	name = split[0].split("/").slice(-2).join("/").replace(".git", "");
	const appPath = resolve(name);

	if (existsSync(appPath)) {
		process.chdir(appPath);
		if (existsSync(".git"))
			await $`git pull`;
		return { name };
	} else {
		const branch = split[1]; // branch might be undefined
		await clone(split[0], name, branch);

		if (!existsSync(join(appPath, "zhiva.json"))) {
			console.error(`[Z-SCR-6-01] 💔 App ${appPath} is not a valid zhiva app`);
			await rm(appPath, { force: true, recursive: true });
			process.exit(1);
		}

		return {
			name,
			dir: appPath,
		};
	}
}
