import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export function chdirToApps() {
	const root = join(homedir(), ".zhiva");
	if (!existsSync(root))
		mkdirSync(root, {
			recursive: true,
		});

	process.chdir(root);
	if (!existsSync("apps"))
		mkdirSync("apps", {
			recursive: true,
		});

	process.chdir("apps");
}
