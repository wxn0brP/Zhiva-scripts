#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync } from "fs";
import { homedir } from "os";
import { db } from "../utils/db";
const silentMode = process.argv[2] === "try";

export async function checkRepos(repos: string[]) {
    const results = new Map<string, boolean>();

    await Promise.all(
        repos.map(async (repo) => {
            try {
                await $`git -C ${repo} fetch --quiet`;

                const out = (await $`git -C ${repo} rev-list --count HEAD..@{u}`.text()).trim();
                const needsUpdate = +out > 0;
                results.set(repo, needsUpdate);

                if (silentMode) return;
                console.log(needsUpdate ? `[Z-SCR-8-02] 💜 ${repo} needs update` : `[Z-SCR-8-03] 💜 ${repo} is up to date`);
            } catch {
                results.set(repo, false);
            }
        })
    );

    return results;
}

process.chdir(`${homedir()}/.zhiva/apps`);
const apps = await db.find("apps").then((apps) => apps.map((app) => app.name));
if (!silentMode) console.log("[Z-SCR-8-01] Checking apps...");
const update = await checkRepos(apps);

if (process.argv[2] === "try") {
    console.log(`[JSON]${JSON.stringify(Object.fromEntries(update))}[/JSON]`);
    process.exit(0);
}

for (const [repo, needsUpdate] of update) {
    if (!needsUpdate) continue;

    console.log(`[Z-SCR-8-04] 💜 Updating ${repo}...`);
    try {
        process.chdir(repo);
        await $`git pull`;
        await $`bun install --production --force`;
        const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
        if (pkg.scripts?.build) {
            await $`bun run build`;
        }
        console.log(`[Z-SCR-8-05] 💜 ${repo} updated`);
    } catch {
        console.error(`[Z-SCR-8-06] Error updating ${repo}`);
    } finally {
        process.chdir("../..");
    }
}