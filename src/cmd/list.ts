#!/usr/bin/env bun

import { db } from "../utils/db";

const apps = await db.find("apps");

if (!apps.length) {
    console.log("No apps installed");
    process.exit(0);
}

console.log("Installed apps:");
for (const app of apps) {
    console.log(`- ${app.name}`);
}
