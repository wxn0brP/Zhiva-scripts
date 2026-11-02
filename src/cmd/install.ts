import { $ } from "bun";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { parseArgs } from "util";
import { db } from "../utils/db";
import { createShortCut } from "../utils/desktop";
import { getPref } from "../utils/pref";
import { ensueFiles } from "../install";
import { isArchiveInput } from "../install/strategy/archive";
import { dim, green, red, yellow } from "../utils/color";

export default async (args: string[]) => {
	const { values, positionals } = parseArgs({
		args,
		options: {
			shortcut: {
				type: "string",
				short: "s",
			},
			name: {
				type: "string",
				short: "n",
			},
		},
		allowPositionals: true,
	});

	if (!positionals[0]) {
		console.error(red("Please provide an app name"));
		process.exit(1);
	}

	const input = positionals[0];
	if (!isArchiveInput(input) && !Bun.which("git")) {
		console.error(red("git is required to install applications."));
		console.error(red("Please install git first."));
		process.exit(1);
	}

	const { dir, name } = await ensueFiles(input, {
		name: values.name || "",
	});

	if (dir) process.chdir(dir);

	if (existsSync("package.json")) {
		const install = await $`bun install --production --force`.nothrow();
		if (install.exitCode !== 0) {
			console.error(
				yellow(
					"Dependency installation failed, the application may not start.",
				),
			);
			console.error(dim(`Run "bun install" manually in ${process.cwd()}.`));
		}

		const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
		if (pkg.scripts?.build) {
			const build = await $`bun run build`.nothrow();
			if (build.exitCode !== 0) {
				console.error(
					yellow("The build script failed, the application may not start."),
				);
				console.error(dim(`Run "bun run build" manually in ${process.cwd()}.`));
			}
		}
	}

	const updated = await db.apps.updateOneOrAdd(
		{
			name,
		},
		{
			updatedAt: Date.now(),
		},
		{
			id_gen: false,
		},
	);

	const zhivaMeta = {
		name,
		icon: "default",
		win_icon: "default",
		shortcut: "dm",
	};

	if (existsSync("zhiva.json")) {
		Object.assign(zhivaMeta, JSON.parse(readFileSync("zhiva.json", "utf-8")));
	}

	const shortCutPreference = await getPref<string>("shortcut");
	if (shortCutPreference)
		zhivaMeta.shortcut = shortCutPreference.includes("n")
			? ""
			: shortCutPreference;

	if (values.shortcut)
		zhivaMeta.shortcut = values.shortcut.includes("n") ? "" : values.shortcut;

	if (updated.type === "added" && zhivaMeta.shortcut?.length) {
		try {
			createShortCut({
				name,
				appName: zhivaMeta.name,
				flags: zhivaMeta.shortcut,
				icon: zhivaMeta?.icon,
				win_icon: zhivaMeta?.win_icon,
			});
		} catch (error: any) {
			console.error(
				yellow(
					`[Z-SCR-11-02] Installed, but the shortcut could not be created: ${error?.message ?? error}`,
				),
			);
			if (process.platform === "win32") {
				console.error(
					dim(
						"Re-run the Zhiva Windows installer to restore the launcher and the protocol handler.",
					),
				);
			}
		}
	}

	if (process.platform === "win32") {
		const launcher = join(homedir(), ".zhiva", "bin", "zhiva.cmd");
		if (!existsSync(launcher)) {
			console.error(yellow(`The Windows launcher is missing: ${launcher}`));
			console.error(
				dim(
					"Shortcuts and zhiva:// links will not work. Re-run the Zhiva Windows installer.",
				),
			);
		}
	}

	console.log(green(`[Z-SCR-11-01] 💜 Installed ${name}`));
};
