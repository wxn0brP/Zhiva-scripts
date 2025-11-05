#!/usr/bin/env bun

let name = process.argv[2];
if (!name) {
    name = "help";
}
process.argv.splice(2, 1);

const aliases = {
    start: ["run", "startup", "o", "r"],
    install: ["i", "add"],
    uninstall: ["rm", "remove"],
    list: ["l", "ls"],
    open: ["link"],
    update: ["u", "up"],
    self: ["update-self", "self-update"],
    guess: ["find"],
    help: ["h"],
}

for (const key of Object.keys(aliases)) {
    if (aliases[key].includes(name)) {
        name = key;
        break;
    }
}

const knownCommands = Object.keys(aliases);
if (!knownCommands.includes(name)) {
    console.error(`Unknown command: ${name}`);
    name = "help";
}

await import("./cmd/" + name);

export { };