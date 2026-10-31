import { existsSync } from "fs";
import { rm } from "fs/promises";
import { homedir } from "os";
import { ensureAppName } from "../utils/appName";
import { db } from "../utils/db";
import { green, red } from "../utils/color";

export default async (args: string[]) => {
	let name = args[0];
	if (!name) {
		console.error(red("Please provide an app name"));
		process.exit(1);
	}

	name = ensureAppName(name);

	process.chdir(`${homedir()}/.zhiva/apps`);

	if (!existsSync(name)) {
		console.error(red(`App ${name} is not installed`));
		process.exit(1);
	}

	const [namespace, appName] = name.split("/");
	process.chdir(namespace);

	try {
		await rm(appName, {
			force: true,
			recursive: true,
		});
	} catch (error) {
		console.error(red(`Error removing app ${name}: ${error.message}`));
		process.exit(1);
	}

	try {
		await db.apps.removeOne({
			name,
		});
	} catch (error) {
		console.error(
			red(`Error removing app ${name} from database: ${error.message}`),
		);
		process.exit(1);
	}

	console.log(green(`App ${name} has been uninstalled`));
};
