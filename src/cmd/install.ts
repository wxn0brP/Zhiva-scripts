import { $ } from "bun";
import { existsSync, readFileSync } from "fs";
import { parseArgs } from "util";
import { db } from "../utils/db";
import { createShortCut } from "../utils/desktop";
import { getPref } from "../utils/pref";
import { ensueFiles } from "../install";

export default async (args: string[]) => {
    const { values, positionals } = parseArgs({
        args,
        options: {
            shortcut: { type: "string", short: "s" },
        },
        allowPositionals: true,
    });

    if (!positionals[0]) {
        console.error("Please provide an app name");
        process.exit(1);
    }

    const { dir, name } = await ensueFiles(positionals[0]);
    if (dir)
        process.chdir(dir);

    if (existsSync("package.json")) {
        await $`bun install --production --force`;
        const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
        if (pkg.scripts?.build) {
            await $`bun run build`;
        }
    }

    const updated = await db.apps.updateOneOrAdd({ name }, { updatedAt: Date.now() });

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
        zhivaMeta.shortcut = shortCutPreference.includes("n") ? "" : shortCutPreference;

    if (values.shortcut)
        zhivaMeta.shortcut = values.shortcut.includes("n") ? "" : values.shortcut;

    if (
        updated.type === "added" &&
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

    console.log(`[Z-SCR-11-01] 💜 Installed ${name}`);
}
