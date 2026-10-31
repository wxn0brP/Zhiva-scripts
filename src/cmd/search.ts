import { getFromCache } from "../utils/cache";
import { _guessApp } from "../utils/guess";
import { db } from "../utils/db";
import { cyan, red } from "../utils/color";

interface Repo {
	name: string;
	desc: string;
	stars: number;
	verified?: boolean;
}

export default async (args: string[]) => {
	try {
		await run(args);
	} catch (error: any) {
		console.error(red(`Search failed: ${error?.message ?? error}`));
		process.exit(1);
	}
};

async function run(args: string[]) {
	const name = args.find(arg => !arg.startsWith("-")) || "";
	const jsonMode = args.includes("--json");
	const prettyMode = args.includes("--pretty");

	let apps = await getFromCache("search", 5 * 60 * 1000, fetchAllRepos);
	const banned = await getFromCache("banned", 5 * 60 * 1000, fetchBanned);

	apps = apps.filter(item => !banned.includes(item.name));

	const localApps = await db.apps.find();
	const localAppNames = localApps.map(app => app.name);

	const allAppNames = [
		...new Set([
			...apps.map(item => item.name),
			...localAppNames,
		]),
	];

	const results = await _guessApp(name, allAppNames);

	if (!jsonMode && !prettyMode) {
		console.log(results.map(result => cyan(result)).join("\n"));
		return;
	}

	const verified = await getFromCache(
		"verified",
		5 * 60 * 1000,
		fetchVerified,
		[
			apps.map(item => item.name),
		],
	);

	apps = apps.filter(item => results.includes(item.name));

	const localAppsToAdd = localApps
		.filter(
			localApp =>
				results.includes(localApp.name) &&
				!apps.some(regApp => regApp.name === localApp.name),
		)
		.map(localApp => ({
			name: localApp.name,
			desc: "Locally installed app",
			stars: 0,
			verified: false,
		}));

	const combinedApps = [
		...apps,
		...localAppsToAdd,
	];

	combinedApps.forEach(item => (item.verified = verified.includes(item.name)));

	console.log(JSON.stringify(combinedApps, null, prettyMode ? 2 : undefined));
}

async function fetchAllRepos(): Promise<Repo[]> {
	const res = await fetch(
		"https://api.github.com/search/repositories?q=topic:Zhiva-app",
	);
	if (!res.ok) {
		const hint =
			res.status === 403 || res.status === 429
				? " (GitHub API rate limit reached, try again in a few minutes)"
				: "";
		throw new Error(`GitHub API responded with HTTP ${res.status}${hint}`);
	}

	const data = await res.json();
	if (!Array.isArray(data.items))
		throw new Error("GitHub API returned an unexpected response");

	return data.items.map((item: any) => ({
		name: item.full_name,
		desc: item.description,
		stars: item.stargazers_count,
	}));
}

async function fetchData(file: string) {
	const res = await fetch(
		`https://raw.githubusercontent.com/wxn0brP/Zhiva-registry/HEAD/${file}.txt`,
	);
	if (!res.ok)
		throw new Error(`Could not load the ${file} list (HTTP ${res.status})`);

	const data = await res.text();
	return data
		.split("\n")
		.map(line => line.split("#")[0].trim())
		.filter(Boolean);
}

async function fetchBanned() {
	return await fetchData("banned");
}

async function fetchVerified(installedApps: string[]) {
	const apps = await fetchData("verified");
	apps.push(...installedApps.filter(app => app.startsWith("wxn0brP/")));
	return apps;
}
