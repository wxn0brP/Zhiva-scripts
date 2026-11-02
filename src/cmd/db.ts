import JSON5 from "json5";
import { red } from "../utils/color";
import { db } from "../utils/db";

export default async (args: string[]) => {
	args = args.map(arg =>
		arg.startsWith("{") || arg.startsWith("[") ? JSON5.parse(arg) : arg,
	);

	const [method, collection, ...rest] = args;

	if (method === "getCollections" || method === "gc") {
		console.log(JSON.stringify(await db.getCollections(), null, 2));
		return;
	}

	if (args.length < 2) {
		console.error(red("Usage: zhiva db <method> <collection> [args...]"));
		process.exit(1);
	}

	const res = await db[collection][method](...rest);
	console.log(JSON.stringify(res, null, 2));
};
