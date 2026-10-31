import { db } from "../utils/db";
import { bold, cyan, dim } from "../utils/color";

const apps = await db.apps.find();

export default (args: string[]) => {
	const json = args.includes("--json");

	if (!apps.length) return console.log(json ? "[]" : dim("No apps installed"));

	if (json) return console.log(JSON.stringify(apps.map(app => app.name)));

	console.log(bold("Installed apps:"));
	for (const app of apps) {
		console.log(`${dim("-")} ${cyan(app.name)}`);
	}
};
