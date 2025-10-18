#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";

let name = process.argv[2];
if (!name) {
    console.error("Please provide an app name");
    process.exit(1);
}

process.chdir(`${process.env.HOME ?? process.env.USERPROFILE}/.zhiva`);
if (!existsSync("apps")) mkdirSync("apps", { recursive: true });
process.chdir("apps");

if (existsSync(name.split("/")[0])) {
    await $`git pull`;
} else {
    if (!name.includes("/")) name = `wxn0brP/${name}`;
    await $`git clone https://github.com/${name}.git`;
}

process.chdir(name);
await $`bun install --production`;
try {
    await $`bun run build`;
} catch (e) {
    console.log(e);
}