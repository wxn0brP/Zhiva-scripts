#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { db } from "./db";
import { createShortCut } from "./desktop";

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
    await $`git clone https://github.com/${name}.git ${name}`;
    process.chdir(name);
}

await $`bun install --production --force`;
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
if (pkg.scripts?.build) {
    await $`bun run build`;
}

const updated = await db.updateOneOrAdd("apps", { name }, { updatedAt: Date.now() });

const zhivaMeta = {
    name,
    icon: undefined as string,
    desktop: ["share", "desktop"]
};

if (existsSync("zhiva.json")) {
    Object.assign(zhivaMeta, JSON.parse(readFileSync("zhiva.json", "utf-8")));
}

if (!updated && zhivaMeta.desktop) {
    if (process.platform === "linux" || process.platform === "darwin") {
        for (const path of zhivaMeta.desktop) {
            createShortCut({
                name,
                appName: zhivaMeta.name,
                path,
                icon: zhivaMeta?.icon
            });
        }
    } else {
        console.error("Desktop files are not supported on this platform");
    }
}