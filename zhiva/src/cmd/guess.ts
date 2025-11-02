#!/usr/bin/env bun

import { db } from "../utils/db";

const name = (process.argv[2] || "").trim();

const pkgs = await db.find("apps");
const names = pkgs.map((pkg) => pkg.name);

if (!name) {
    process.stdout.write(names.join("\n"));
    process.exit(0);
}

const fuzzyMatch = (query: string, text: string) => {
    query = query.toLowerCase();
    text = text.toLowerCase();

    let i = 0;
    for (const char of text) {
        if (char === query[i]) i++;
        if (i === query.length) return true;
    }
    return false;
}

const filtered = names
    .filter((n) => fuzzyMatch(name, n))
    .sort((a, b) => a.length - b.length);

process.stdout.write(filtered.join("\n"));