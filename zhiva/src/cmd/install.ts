#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { db } from "../utils/db";
import { createShortCut } from "../utils/desktop";

let name = process.argv[2];
if (!name) {
    console.error("Please provide an app name");
    process.exit(1);
}
if (!name.includes("/")) name = `wxn0brP/${name}`;

process.chdir(`${homedir()}/.zhiva`);
if (!existsSync("apps")) mkdirSync("apps", { recursive: true });
process.chdir("apps");

if (existsSync(name)) {
    process.chdir(name);
    await $`git pull`;
} else {
    let branch: string | undefined = undefined;
    let cloneName = name;

    try {
        let configBranch = "HEAD";
        let configPath = "zhiva.json";
        const maxRedirects = 15;

        for (let i = 0; i < maxRedirects; i++) {
            if (i === maxRedirects - 1) {
                console.error("Exceeded max redirects while resolving config.");
                break;
            };

            const res = await fetch(`https://raw.githubusercontent.com/${cloneName}/${configBranch}/${configPath}`);
            if (!res.ok) break;
            const tempConfig = await res.json();

            if (tempConfig.redirect_repo) {
                console.log(`Redirecting from "${cloneName}" to "${tempConfig.redirect_repo}"...`);
                name = tempConfig.redirect_repo;
                cloneName = tempConfig.redirect_repo;
                configBranch = "HEAD";
                configPath = "zhiva.json";
                continue;
            }

            if (tempConfig.redirect_zhiva) {
                const [newPath, newBranch] = tempConfig.redirect_zhiva.split("#");
                configPath = newPath.startsWith("./") ? newPath.slice(2) : newPath;
                if (newBranch) configBranch = newBranch;
                console.log(`Redirecting zhiva.json to "${tempConfig.redirect_zhiva}"...`);
                continue;
            }

            branch = tempConfig.branch;
            break;
        }
    } catch (e) {
        console.error("Error resolving zhiva config:", e.message);
    }

    const cloneUrl = `https://github.com/${cloneName}.git`;
    if (branch) {
        await $`git clone -b ${branch} ${cloneUrl} ${name}`;
    } else {
        await $`git clone ${cloneUrl} ${name}`;
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
    icon: undefined as string,
    win_icon: undefined as string,
    desktop: ["share", "desktop"]
};

if (existsSync("zhiva.json")) {
    Object.assign(zhivaMeta, JSON.parse(readFileSync("zhiva.json", "utf-8")));
}

if (!process.argv.includes("--nd") && !updated && zhivaMeta.desktop && zhivaMeta.desktop.length) {
    for (const path of zhivaMeta.desktop) {
        createShortCut({
            name,
            appName: zhivaMeta.name,
            path,
            icon: zhivaMeta?.icon,
            win_icon: zhivaMeta?.win_icon,
        });
    }
}