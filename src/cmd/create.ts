import { $ } from "bun";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "fs";
import { userInfo } from "os";
import { basename, dirname, join, resolve } from "path";
import { parseArgs } from "util";
import { bold, cyan, dim, green, red } from "../utils/color";

const DEFAULT_TEMPLATE = "https://github.com/wxn0brP/Zhiva-template-app.git";

function usage() {
	console.log(
		`
${bold("Usage:")} zhiva create [name] [options]

Create a new Zhiva application from a template.

When name is omitted, it is asked in a terminal. Without metadata flags, the
command also asks for the display name, author and description. Any metadata
flag disables the questions.

${bold("Options:")}
  ${cyan("-t, --template <url>")}       Template repository (default: ${DEFAULT_TEMPLATE})
  ${cyan("-a, --author <name>")}        Author name (default: git user.name)
      ${cyan("--display-name <name>")}  Display name (default: derived from app name)
      ${cyan("--description <text>")}   Description (default: display name)
      ${cyan("--no-install")}           Skip dependency installation
      ${cyan("--no-input")}             Do not ask questions
  ${cyan("-h, --help")}                 Show this help message

${bold("Examples:")}
  zhiva create my-app
  zhiva create my-app --author wxn0brP --description "My first app"
  zhiva create my-app --template https://github.com/user/repo.git
`.trimStart(),
	);
}

function packageName(name: string, fallback = "zhiva-app") {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9._-]+/g, "-")
			.replace(/^[-._]+|[-._]+$/g, "") || fallback
	);
}

function displayName(name: string) {
	return (
		name
			.split(/[-_.\s]+/)
			.filter(Boolean)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ") || name
	);
}

function detectAuthor() {
	const proc = Bun.spawnSync({
		cmd: [
			"git",
			"config",
			"--get",
			"user.name",
		],
		stdout: "pipe",
		stderr: "ignore",
	});

	const configured = proc.exitCode === 0 ? proc.stdout.toString().trim() : "";
	return configured || userInfo().username || "your-name";
}

function ask(question: string, fallback: string) {
	const answer = prompt(`${question} [${fallback}]:`);
	const value = (answer ?? "").trim();
	return value || fallback;
}

function replaceTokens(value: any, tokens: Record<string, string>): any {
	if (typeof value === "string") {
		let result = value;
		for (const [token, replacement] of Object.entries(tokens)) {
			result = result.replaceAll(token, replacement);
		}
		return result;
	}

	if (Array.isArray(value)) {
		return value.map(item => replaceTokens(item, tokens));
	}

	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [
				key,
				replaceTokens(item, tokens),
			]),
		);
	}

	return value;
}

function readJson(path: string) {
	if (!existsSync(path)) return null;
	return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path: string, data: any) {
	writeFileSync(path, `${JSON.stringify(data, null, "\t")}\n`);
}

function replaceInFile(path: string, tokens: Record<string, string>) {
	if (!existsSync(path)) return false;

	const content = readFileSync(path, "utf-8");
	const replaced = replaceTokens(content, tokens);
	if (replaced === content) return false;

	writeFileSync(path, replaced);
	return true;
}

function updateInstallBadge(path: string, appRef: string) {
	if (!existsSync(path)) return false;

	const content = readFileSync(path, "utf-8");
	const replaced = content.replace(
		/(https:\/\/wxn0brp\.github\.io\/Zhiva-page\/i#app=)[^)\s]+/g,
		`$1${appRef}`,
	);
	if (replaced === content) return false;

	writeFileSync(path, replaced);
	return true;
}

export default async (args: string[]) => {
	const { values, positionals } = parseArgs({
		args,
		options: {
			template: {
				type: "string",
				short: "t",
			},
			author: {
				type: "string",
				short: "a",
			},
			"display-name": {
				type: "string",
			},
			description: {
				type: "string",
			},
			"no-install": {
				type: "boolean",
			},
			"no-input": {
				type: "boolean",
			},
			help: {
				type: "boolean",
				short: "h",
			},
		},
		allowPositionals: true,
	});

	if (values.help) {
		usage();
		return;
	}

	const name = positionals[0];
	const hasMetadataFlags =
		values.author !== undefined ||
		values["display-name"] !== undefined ||
		values.description !== undefined;
	const interactive =
		!hasMetadataFlags && !values["no-input"] && Boolean(process.stdin.isTTY);

	let directory = name;
	if (!directory && interactive) {
		directory = ask("Application directory", "my-app");
	}

	if (!directory) {
		console.error(red("Please provide an application directory."));
		console.error("");
		usage();
		process.exit(1);
	}

	const target = resolve(process.cwd(), directory);
	const shortName = basename(target);
	const template = values.template || DEFAULT_TEMPLATE;

	if (!Bun.which("git")) {
		console.error(red("git is required to create an application."));
		console.error(red("Install git with your system package manager."));
		process.exit(1);
	}

	if (existsSync(target)) {
		const entries = readdirSync(target);
		if (entries.length > 0) {
			console.error(
				red(`Directory ${target} already exists and is not empty.`),
			);
			console.error(red("Choose another name or remove the directory first."));
			process.exit(1);
		}
	}

	const pkgName = packageName(shortName);
	let display = values["display-name"]?.trim() || displayName(shortName);
	let author = values.author?.trim() || detectAuthor();
	let description = values.description?.trim() || "";

	if (interactive) {
		display = ask("Application display name", display);
		author = ask("Author", author);
		description = ask("Description", description || display);
	} else if (!description) {
		description = display;
	}

	const authorSlug = packageName(author, "your-name");
	const repoOwner = author.replace(/\s+/g, "-");
	const year = String(new Date().getFullYear());

	console.log(cyan(`Creating ${shortName} from ${template}...`));
	mkdirSync(dirname(target), {
		recursive: true,
	});
	const clone = await $`git clone --depth 1 ${template} ${target}`.nothrow();
	if (clone.exitCode !== 0) {
		console.error(red(`Failed to clone ${template}.`));
		console.error(red("Check that git and the template URL are correct."));
		process.exit(1);
	}

	rmSync(join(target, ".git"), {
		recursive: true,
		force: true,
	});
	await $`git init`.cwd(target).nothrow();

	const pkgPath = join(target, "package.json");
	const pkgSource = readJson(pkgPath);
	if (pkgSource) {
		const sourceName = typeof pkgSource.name === "string" ? pkgSource.name : "";
		const hadNameToken = sourceName.includes("[YOUR");
		const pkg = replaceTokens(pkgSource, {
			"[YOUR NAME]": repoOwner,
			"[YOUR APP NAME]": shortName,
		});

		pkg.name = hadNameToken
			? sourceName.startsWith("@")
				? `@${authorSlug}/${pkgName}`
				: pkgName
			: pkgName;
		pkg.author = author;
		pkg.description = description;
		writeJson(pkgPath, pkg);
	}

	const zhivaPath = join(target, "zhiva.json");
	const zhivaSource = readJson(zhivaPath);
	if (zhivaSource) {
		const zhiva = replaceTokens(zhivaSource, {
			"[YOUR NAME]": author,
			"[YOUR APP NAME]": display,
		});

		zhiva.name = display;
		zhiva.description = description;
		zhiva.author = author;
		writeJson(zhivaPath, zhiva);
	}

	replaceInFile(join(target, "LICENSE"), {
		"[YEAR]": year,
		"[YOUR NAME]": author,
	});

	replaceInFile(join(target, "README.md"), {
		"[YEAR]": year,
		"[YOUR NAME]": author,
		"[YOUR APP NAME]": display,
	});

	updateInstallBadge(join(target, "README.md"), `${repoOwner}/${shortName}`);

	if (!values["no-install"]) {
		console.log(cyan("Installing dependencies..."));
		const install = await $`bun install`.cwd(target).nothrow();
		if (install.exitCode !== 0) {
			console.error(red("Dependency installation failed."));
			console.error(red(`Run "bun install" manually in ${target}.`));
		}
	}

	console.log("");
	console.log(green(`Created ${shortName} in ${target}`));
	console.log("");
	console.log(`${dim("name:")}        ${display}`);
	console.log(`${dim("package:")}     ${pkgName}`);
	console.log(`${dim("author:")}      ${author}`);
	console.log(`${dim("description:")} ${description}`);
	console.log("");
	console.log(bold("Next steps:"));
	console.log(`  ${cyan(`cd ${name}`)}`);
	console.log(`  ${cyan("zhiva start .")}`);
	console.log("");
	console.log(dim("Edit zhiva.json to set the icons."));
};
