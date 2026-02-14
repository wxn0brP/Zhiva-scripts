import { $, spawn } from "bun";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { db } from "../utils/db";

export async function checkRepos(repos: string[], jsonMode = false) {
    const results = new Map<string, boolean>();

    await Promise.all(
        repos.map(async (repo) => {
            try {
                if (!existsSync(join(repo, ".git"))) {
                    results.set(repo, false);
                    return;
                }

                const proc = spawn(
                    ["git", "-C", repo, "fetch", "--quiet"],
                    {
                        stdout: "ignore",
                        stderr: "ignore",
                    }
                );

                const exitCode = await proc.exited;
                if (exitCode !== 0) {
                    results.set(repo, false);
                    return;
                }

                const out = (await $`git -C ${repo} rev-list --count HEAD..@{u}`.text()).trim();
                const needsUpdate = +out > 0;
                results.set(repo, needsUpdate);

                if (jsonMode) return;
                console.log(needsUpdate ? `[Z-SCR-8-02] 💜 ${repo} needs update` : `[Z-SCR-8-03] 💜 ${repo} is up to date`);
            } catch {
                results.set(repo, false);
            }
        })
    );

    return results;
}

export default async (args: string[]) => {
    const jsonMode = args.includes("--json");
    process.chdir(`${homedir()}/.zhiva/apps`);

    const apps = await db.apps.find();
    const appNames = apps.map((app) => app.name);
    if (!jsonMode) console.log("[Z-SCR-8-01] Checking apps...");

    const update = await checkRepos(appNames, jsonMode);

    if (jsonMode) {
        console.log(JSON.stringify(Object.fromEntries(update)));
        return;
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
}
