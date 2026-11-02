import { rmdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { parseArgs } from "util";
import { db } from "../utils/db";
import {
	AppsDiff,
	diffApps,
	findEmptyNamespaces,
	scanInstalledApps,
} from "../utils/apps";
import { bold, cyan, dim, green, red, yellow } from "../utils/color";

const zhivaRoot = join(homedir(), ".zhiva");
const appsDir = join(zhivaRoot, "apps");

function usage() {
	console.log(
		`
${bold("Usage:")} zhiva repair [options]

Reconcile the app database with the directories in ~/.zhiva/apps.

${bold("Options:")}
  ${cyan("-h, --help")}       Show this help message
  ${cyan("--dry-run")}        Show the diff without applying changes
  ${cyan("-y, --yes")}        Apply changes without confirmation
  ${cyan("--json")}           Output as JSON (preview unless --yes is used)
  ${cyan("--prune-empty")}    Remove empty namespace directories

${bold("Examples:")}
  zhiva repair --dry-run
  zhiva repair
  zhiva repair --yes --prune-empty
`.trimStart(),
	);
}

function printReport(
	diff: AppsDiff,
	dbCount: number,
	diskCount: number,
	emptyNamespaces: string[],
) {
	console.log(`${bold("Zhiva DB repair")} ${dim(`(${appsDir})`)}`);
	console.log(`${dim("database:")} ${dbCount} entries`);
	console.log(`${dim("apps:")} ${diskCount} directories`);
	console.log("");

	for (const app of diff.missingInDb) {
		console.log(`${green("+")} ${app.name} ${dim("(add to database)")}`);
	}

	for (const name of diff.missingOnDisk) {
		console.log(`${red("-")} ${name} ${dim("(remove from database)")}`);
	}

	for (const app of diff.broken) {
		console.log(
			`${yellow("!")} ${app.name} ${dim("(missing zhiva.json, skipped)")}`,
		);
	}

	for (const name of diff.matched) {
		console.log(`${dim("=")} ${name} ${dim("(in sync)")}`);
	}

	for (const name of emptyNamespaces) {
		console.log(`${red("-")} ${name}/ ${dim("(empty namespace)")}`);
	}
}

async function applyChanges(diff: AppsDiff, pruneEmpty: boolean) {
	for (const app of diff.missingInDb) {
		await db.apps.updateOneOrAdd(
			{
				name: app.name,
			},
			{
				updatedAt: Date.now(),
			},
			{
				id_gen: false,
			},
		);
	}

	for (const name of diff.missingOnDisk) {
		await db.apps.removeOne({
			name,
		});
	}

	if (!pruneEmpty) return 0;

	let removed = 0;
	for (const name of findEmptyNamespaces(appsDir)) {
		rmdirSync(join(appsDir, name));
		removed++;
	}

	return removed;
}

function printJson(
	diff: AppsDiff,
	dbCount: number,
	diskCount: number,
	emptyNamespaces: string[],
	applied: boolean,
) {
	console.log(
		JSON.stringify(
			{
				appsDir,
				database: dbCount,
				apps: diskCount,
				diff: {
					add: diff.missingInDb.map(app => app.name),
					remove: diff.missingOnDisk,
					matched: diff.matched,
					broken: diff.broken.map(app => app.name),
					emptyNamespaces,
				},
				applied,
			},
			null,
			2,
		),
	);
}

export default async (args: string[]) => {
	const { values } = parseArgs({
		args,
		options: {
			help: {
				type: "boolean",
				short: "h",
			},
			"dry-run": {
				type: "boolean",
			},
			yes: {
				type: "boolean",
				short: "y",
			},
			json: {
				type: "boolean",
			},
			"prune-empty": {
				type: "boolean",
			},
		},
	});

	if (values.help) {
		usage();
		return;
	}

	const diskApps = scanInstalledApps(appsDir);
	const apps = await db.apps.find();
	const dbNames = apps.map(app => app.name);
	const diff = diffApps(dbNames, diskApps);
	const pruneEmpty = !!values["prune-empty"];
	const emptyNamespaces = pruneEmpty ? findEmptyNamespaces(appsDir) : [];
	const hasChanges =
		diff.missingInDb.length > 0 ||
		diff.missingOnDisk.length > 0 ||
		emptyNamespaces.length > 0;

	if (!values.json) {
		printReport(diff, dbNames.length, diskApps.length, emptyNamespaces);
	}

	if (!hasChanges) {
		if (values.json) {
			printJson(diff, dbNames.length, diskApps.length, [], false);
			return;
		}

		console.log("");
		console.log(green("[Z-SCR-12-02] Database is in sync."));
		return;
	}

	if (values["dry-run"]) {
		if (values.json) {
			printJson(diff, dbNames.length, diskApps.length, emptyNamespaces, false);
		} else {
			console.log("");
			console.log(yellow("[Z-SCR-12-06] Dry run: no changes applied."));
		}
		process.exit(1);
	}

	if (values.json && !values.yes) {
		printJson(diff, dbNames.length, diskApps.length, emptyNamespaces, false);
		process.exit(1);
	}

	let apply = !!values.yes;
	if (!apply) {
		if (!process.stdin.isTTY) {
			console.error("");
			console.error(
				red(
					"[Z-SCR-12-05] No TTY available. Re-run with --yes to apply changes.",
				),
			);
			process.exit(1);
		}

		console.log("");
		const answer = prompt("Apply these changes? [y/N]");
		apply = /^y(es)?$/i.test((answer ?? "").trim());
	}

	if (!apply) {
		console.log(yellow("[Z-SCR-12-06] Aborted, no changes applied."));
		process.exit(1);
	}

	const pruned = await applyChanges(diff, pruneEmpty);

	if (values.json) {
		printJson(diff, dbNames.length, diskApps.length, emptyNamespaces, true);
		return;
	}

	console.log("");
	console.log(
		green(
			`[Z-SCR-12-07] Applied: ${diff.missingInDb.length} added, ${diff.missingOnDisk.length} removed` +
				(pruneEmpty ? `, ${pruned} empty namespace(s) pruned` : ""),
		),
	);
};
