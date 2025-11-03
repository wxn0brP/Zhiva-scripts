#!/usr/bin/env bun

import { guessApp } from "../utils/guess";

const name = (process.argv[2] || "").trim();
const results = await guessApp(name);
process.stdout.write(results.join("\n"));