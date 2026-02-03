import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { ensureAppName } from "../utils/appName";
import { db } from "../utils/db";
import { createShortCut } from "../utils/desktop";
import { clone, getConfig } from "../utils/install";
import { getPref } from "../utils/pref";
import { parseArgs } from "util";

export default async (args: string[]) => {
    const { values, positionals } = parseArgs({
        args,
        options: {
            shortcut: { type: "string", short: "s" },
        },
        allowPositionals: true,
    });

    let name = positionals[0];
    if (!name) {
        console.error("Please provide an app name");
        process.exit(1);
    }

    name = ensureAppName(name);
    let branch: string | undefined = undefined;
    [name, branch] = name.split("#");

    process.chdir(`${homedir()}/.zhiva`);
    if (!existsSync("apps")) mkdirSync("apps", { recursive: true });
    process.chdir("apps");

    let appPath = name;
    if (name.startsWith("http") && name.endsWith(".git")) {
        appPath = new URL(name.replace(".git", "")).pathname.split("/").slice(-2).join("/");
    }

    if (existsSync(appPath)) {
        process.chdir(appPath);
        await $`git pull`;
        name = appPath;

    } else {
        if (name.startsWith("http") && name.endsWith(".git")) {
            await clone(name, appPath, branch);
            name = appPath;

        } else {
            if (!branch) {
                [name, branch] = await getConfig(name);
            }

            await clone(`https://github.com/${name}.git`, name, branch);
        }

        process.chdir(name);
    }

    if (existsSync("package.json")) {
        await $`bun install --production --force`;
        const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
        if (pkg.scripts?.build) {
            await $`bun run build`;
        }
    }

    const updated = await db.updateOneOrAdd("apps", { name }, { updatedAt: Date.now() });

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
        zhivaMeta.shortcut = shortCutPreference;

    if (values.shortcut)
        zhivaMeta.shortcut = values.shortcut.includes("n") ? "" : values.shortcut;

    if (
        !updated &&
        zhivaMeta.shortcut?.length
    ) {
        createShortCut({
            name,
            appName: zhivaMeta.name,
            flags: zhivaMeta.shortcut,
            icon: zhivaMeta?.icon,
            win_icon: zhivaMeta?.win_icon,
        });
    }
}