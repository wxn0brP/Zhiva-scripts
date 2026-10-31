#!/usr/bin/env bun

import { red } from "./utils/color";

let name = process.argv[2];
if (!name) {
	name = "help";
}

const aliases = {
	start: [
		"run",
		"startup",
		"o",
		"r",
	],
	install: [
		"i",
		"add",
	],
	create: [
		"new",
	],
	uninstall: [
		"rm",
		"remove",
	],
	list: [
		"l",
		"ls",
	],
	open: [
		"link",
	],
	update: [
		"u",
		"up",
	],
	self: [
		"update-self",
		"self-update",
	],
	guess: [
		"find",
	],
	search: [
		"s",
	],
	"create-desktop-file": [
		"cdf",
	],
	db: [],
	doctor: [],
	version: [
		"--version",
		"-v",
		"v",
	],
	help: [
		"h",
	],
	protocol: [],
};

for (const key of Object.keys(aliases)) {
	if (aliases[key].includes(name)) {
		name = key;
		break;
	}
}

const knownCommands = Object.keys(aliases);
if (!knownCommands.includes(name)) {
	console.error(red(`Unknown command: ${name}`));
	name = "help";
}

import("./cmd/" + name).then(module => module.default(process.argv.slice(3)));
