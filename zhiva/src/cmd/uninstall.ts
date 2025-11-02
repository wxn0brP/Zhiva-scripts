#!/usr/bin/env bun

import { existsSync } from "fs";
import { rm } from "fs/promises";
import { homedir } from "os";
import { db } from "../utils/db";

let name = process.argv[2];
if (!name) {
    console.error("Please provide an app name");
    process.exit(1);
}
if (!name.includes("/")) name = `wxn0brP/${name}`;

process.chdir(`${homedir()}/.zhiva/apps`);

if (!existsSync(name)) {
    console.error(`App ${name} is not installed`);
    process.exit(1);
}

const [namespace, appName] = name.split("/");
process.chdir(namespace);

try {
    await rm(appName, { force: true, recursive: true });
} catch (error) {
    console.error(`Error removing app ${name}: ${error.message}`);
    process.exit(1);
}

try {
    await db.removeOne("apps", { name });
} catch (error) {
    console.error(`Error removing app ${name} from database: ${error.message}`);
    process.exit(1);
}

console.log(`App ${name} has been uninstalled`);