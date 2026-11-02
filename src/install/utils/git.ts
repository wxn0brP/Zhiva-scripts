import { $ } from "bun";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import { cyan, dim, red } from "../../utils/color";

export async function getConfig(name: string) {
	let branch: string | undefined;
	let cloneName = name;

	try {
		let configBranch = "HEAD";
		let configPath = "zhiva.json";
		const maxRedirects = 15;

		for (let i = 0; i < maxRedirects; i++) {
			if (i === maxRedirects - 1) {
				console.error(red("Exceeded max redirects while resolving config."));
				break;
			}

			const res = await fetch(
				`https://raw.githubusercontent.com/${cloneName}/${configBranch}/${configPath}`,
			);
			if (!res.ok) break;
			const tempConfig = await res.json().catch(() => ({}));

			if (tempConfig.redirect_repo) {
				console.log(
					cyan(
						`Redirecting from "${cloneName}" to "${tempConfig.redirect_repo}"...`,
					),
				);
				name = tempConfig.redirect_repo;
				cloneName = tempConfig.redirect_repo;
				configBranch = "HEAD";
				configPath = "zhiva.json";
				continue;
			}

			if (tempConfig.redirect_zhiva) {
				const [newPath, newBranch] = tempConfig.redirect_zhiva.split("#");
				configPath = newPath.startsWith("./") ? newPath.slice(2) : newPath;
				if (newBranch) configBranch = newBranch;
				console.log(
					cyan(`Redirecting zhiva.json to "${tempConfig.redirect_zhiva}"...`),
				);
				continue;
			}

			branch = tempConfig.branch;
			break;
		}
	} catch (e) {
		console.error(red("Error resolving zhiva config:"), e.message);
	}

	return [
		cloneName,
		branch,
	];
}

export async function clone(cloneUrl: string, name: string, branch = "") {
	const existed = existsSync(name);
	const result = branch
		? await $`git clone -b ${branch} ${cloneUrl} ${name}`.nothrow()
		: await $`git clone ${cloneUrl} ${name}`.nothrow();

	if (result.exitCode !== 0) {
		if (!existed)
			await rm(name, {
				recursive: true,
				force: true,
			});
		console.error(red(`Failed to clone ${cloneUrl}.`));
		console.error(
			red(
				"Check the repository name, your connection and that the repository is public.",
			),
		);
		process.exit(1);
	}
}

export async function pull() {
	const result = await $`git pull`.nothrow();
	if (result.exitCode !== 0) {
		console.error(red("Failed to update the application."));
		console.error(dim(`Run "git pull" manually in ${process.cwd()}.`));
		process.exit(1);
	}
}

export async function checkIsZhivaApp(name: string) {
	const url = `https://raw.githubusercontent.com/${name}/HEAD/zhiva.json`;
	try {
		const res = await fetch(url);
		const json = await res.json();
		if (!json) return false;
		return true;
	} catch (e) {
		return false;
	}
}
