#!/usr/bin/env bun

const name = process.argv[2];
if (!name) {
    console.error("Please provide an module name");
    process.exit(1);
}
process.argv.splice(2, 1);

await import("./" + name);

export { };