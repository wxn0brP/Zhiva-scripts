#!/usr/bin/env bun

let name = process.argv[2];
if (!name) {
    console.error("Please provide an module name");
    process.exit(1);
}
process.argv.splice(2, 1);

const aliases = {
    start: ["run", "startup", "o", "r"],
    install: ["i", "add"],
}

for (const key of Object.keys(aliases)) {
    if (aliases[key].includes(name)) {
        name = key;
        break;
    }
}

await import("./" + name);

export { };