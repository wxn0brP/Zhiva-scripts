#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync } from "fs";
import { homedir } from "os";
import { db } from "../utils/db";

export async function checkRepos(repos: string[]) {
    const results = new Map<string, boolean>();

    for (const repo of repos) {
        try {
            await $`git -C ${repo} fetch --quiet`;
            const [local, remote, base] = await Promise.all([
                $`git -C ${repo} rev-parse @`.text(),
                $`git -C ${repo} rev-parse @{u}`.text(),
                $`git -C ${repo} merge-base @ @{u}`.text(),
            ]);

            const needsUpdate = local.trim() === base.trim() && remote.trim() !== base.trim();
            results.set(repo, needsUpdate);
        } catch {
            results.set(repo, false);
        }
    }

    return results;
}

process.chdir(`${homedir()}/.zhiva/apps`);
const apps = await db.find("apps").then((apps) => apps.map((app) => app.name));
console.log("[Z-SCR-8-01] Checking apps...");
const update = await checkRepos(apps);

if (process.argv[2] === "try") {
    console.log(`[JSON]${JSON.stringify(Object.fromEntries(update))}[/JSON]`);
    process.exit(0);
}

for (const [repo, needsUpdate] of update) {
    if (!needsUpdate) {
        console.log(`[Z-SCR-8-07] 💜 ${repo} is up to date`);
        continue;
    }

    console.log(`[Z-SCR-8-02] 💜 ${repo} needs update`);
    try {
        process.chdir(repo);
        await $`git pull`;
        await $`bun install --production --force`;
        const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
        if (pkg.scripts?.build) {
            await $`bun run build`;
        }
        console.log(`[Z-SCR-8-03] 💜 ${repo} updated`);
    } catch {
        console.error(`[Z-SCR-8-06] Error updating ${repo}`);
    } finally {
        process.chdir("../..");
    }
}