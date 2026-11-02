import { existsSync } from "fs";
import { rm } from "fs/promises";
import { join, resolve } from "path";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { clone, pull } from "../utils/git";
import { red } from "../../utils/color";

export function isHttpGitInput(input: string) {
	return input.startsWith("http");
}

export const httpGitStrategy: InstallationStrategy = async context => {
	const { input } = context;

	chdirToApps();

	const split = input.split("#"); // name # branch
	const name =
		context.name ||
		split[0].split("/").slice(-2).join("/").replace(".git", "") +
			(split[1] ? "#" + split[1] : "");

	const appPath = resolve(name);

	if (existsSync(appPath)) {
		process.chdir(appPath);
		if (existsSync(".git")) await pull();
		return {
			name,
		};
	} else {
		const branch = split[1]; // branch might be undefined
		await clone(split[0], name, branch);

		if (!existsSync(join(appPath, "zhiva.json"))) {
			console.error(
				red(`[Z-SCR-6-01] 💔 App ${appPath} is not a valid zhiva app`),
			);
			await rm(appPath, {
				force: true,
				recursive: true,
			});
			process.exit(1);
		}

		return {
			name,
			dir: appPath,
		};
	}
};
