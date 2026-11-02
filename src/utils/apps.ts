import { existsSync, readdirSync } from "fs";
import { join } from "path";

export interface DiskApp {
	name: string;
	path: string;
	hasConfig: boolean;
}

export interface AppsDiff {
	missingInDb: DiskApp[];
	missingOnDisk: string[];
	matched: string[];
	broken: DiskApp[];
}

export function scanInstalledApps(appsDir: string): DiskApp[] {
	if (!existsSync(appsDir)) return [];

	const apps: DiskApp[] = [];
	for (const namespace of readdirSync(appsDir, {
		withFileTypes: true,
	})) {
		if (!namespace.isDirectory() || namespace.name.startsWith(".")) continue;

		const namespacePath = join(appsDir, namespace.name);
		for (const entry of readdirSync(namespacePath, {
			withFileTypes: true,
		})) {
			if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

			const path = join(namespacePath, entry.name);
			apps.push({
				name: `${namespace.name}/${entry.name}`,
				path,
				hasConfig: existsSync(join(path, "zhiva.json")),
			});
		}
	}

	return apps.sort((a, b) => a.name.localeCompare(b.name));
}

export function diffApps(dbNames: string[], diskApps: DiskApp[]): AppsDiff {
	const dbSet = new Set(dbNames);
	const diskNames = new Set(diskApps.map(app => app.name));

	return {
		missingInDb: diskApps.filter(app => app.hasConfig && !dbSet.has(app.name)),
		missingOnDisk: [
			...dbSet,
		]
			.sort()
			.filter(name => !diskNames.has(name)),
		matched: diskApps
			.filter(app => app.hasConfig && dbSet.has(app.name))
			.map(app => app.name),
		broken: diskApps.filter(app => !app.hasConfig),
	};
}

export function findEmptyNamespaces(appsDir: string) {
	if (!existsSync(appsDir)) return [];

	return readdirSync(appsDir, {
		withFileTypes: true,
	})
		.filter(entry => entry.isDirectory() && !entry.name.startsWith("."))
		.filter(entry => readdirSync(join(appsDir, entry.name)).length === 0)
		.map(entry => entry.name)
		.sort();
}
