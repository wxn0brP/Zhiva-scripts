#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { createDesktopFile } from "./desktop";

let name = process.argv[2];
if (!name) {
    console.error("Please provide an app name");
    process.exit(1);
}
if (!name.includes("/")) name = `wxn0brP/${name}`;

process.chdir(`${process.env.HOME ?? process.env.USERPROFILE}/.zhiva`);
if (!existsSync("apps")) mkdirSync("apps", { recursive: true });
process.chdir("apps");

if (existsSync(name)) {
    process.chdir(name);
    await $`git pull`;
} else {
    await $`git clone https://github.com/${name}.git ${name}`;
    process.chdir(name);
}

await $`bun install --production`;
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
if (pkg.scripts?.build) {
    await $`bun run build`;
}

const zhivaMeta = {
    name,
    icon: undefined as string,
    desktop: ["share", "desktop"]
};
if (existsSync("zhiva.json")) {
    Object.assign(zhivaMeta, JSON.parse(readFileSync("zhiva.json", "utf-8")));
}

if (zhivaMeta.desktop) {
    if (process.platform === "linux" || process.platform === "darwin") {
        for (const path of zhivaMeta.desktop) {
            createDesktopFile({ name, path, icon: zhivaMeta?.icon });
        }
    } else {
        console.error("Desktop files are not supported on this platform");
    }
}