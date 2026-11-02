import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { cp, mkdir, readdir, rm } from "fs/promises";
import { homedir } from "os";
import { join, resolve } from "path";
import { dim, red } from "../../utils/color";

export const extensionsCmd: Record<string, string[]> = {
	".zip": [
		"unzip",
	],
	".tar.gz": [
		"tar",
		"-xvf",
	],
	".tar.bz2": [
		"tar",
		"-xvf",
	],
	".tar.xz": [
		"tar",
		"-xvf",
	],
	".7z": [
		"7z",
		"x",
	],
};

async function downloadFileIsNeeded(rawUrl: string) {
	const url = new URL(rawUrl);
	const fileName = url.pathname.split("/").pop();

	if (existsSync(fileName)) return fileName;

	await $`curl -o ${fileName} ${rawUrl}`;
	return fileName;
}

async function findZhivaFile(path: string): Promise<string | null> {
	const curr = join(path, "zhiva.json");
	if (existsSync(curr)) return path;

	const files = await readdir(path);
	for (const file of files) {
		const curr = join(path, file);
		const result = await findZhivaFile(curr);
		if (result) return result;
	}

	return null;
}

function windowsZipCommands(file: string) {
	const commands: string[][] = [];
	if (Bun.which("tar"))
		commands.push([
			"tar",
			"-xf",
			file,
		]);
	if (Bun.which("powershell")) {
		const escaped = file.replaceAll("'", "''");
		commands.push([
			"powershell",
			"-NoProfile",
			"-Command",
			`Expand-Archive -LiteralPath '${escaped}' -DestinationPath . -Force`,
		]);
	}
	if (Bun.which("unzip"))
		commands.push([
			"unzip",
			file,
		]);

	return commands;
}

function resolveExtractors(extension: string, file: string) {
	if (extension === ".zip" && process.platform === "win32")
		return windowsZipCommands(file);

	const command = extensionsCmd[extension];
	return command
		? [
				[
					...command,
					file,
				],
			]
		: [];
}

export async function downloadAndExtract(
	urlOrFile: string,
	previousCwd: string,
	name: string,
) {
	const isUrl = urlOrFile.startsWith("http");
	const file = isUrl
		? resolve(await downloadFileIsNeeded(urlOrFile))
		: resolve(previousCwd, urlOrFile);

	if (!existsSync(file)) {
		console.error(red("[Z-SCR-10-01] File not found at"), file);
		process.exit(1);
	}

	const extension = Object.keys(extensionsCmd)
		.sort((a, b) => b.length - a.length)
		.find(ext => file.endsWith(ext));

	if (!extension) {
		console.error(red("[Z-SCR-10-02] Invalid file extension:"), file);
		process.exit(1);
	}

	const zhivaBaseApps = join(homedir(), ".zhiva", "apps");
	const zhivaTempDir = join(zhivaBaseApps, "archive", "temp");

	if (existsSync(zhivaTempDir))
		await rm(zhivaTempDir, {
			recursive: true,
			force: true,
		});

	mkdirSync(zhivaTempDir, {
		recursive: true,
	});

	process.chdir(zhivaTempDir);

	const commands = resolveExtractors(extension, file);
	if (!commands.length) {
		console.error(
			red(
				`[Z-SCR-10-06] Cannot extract ${extension} archives: missing archive tool`,
			),
		);
		if (process.platform === "win32") {
			console.error(
				dim(
					"Windows 10 and newer include tar. For .7z archives install 7-Zip.",
				),
			);
		} else {
			console.error(
				dim("Install the missing archive tool with your package manager."),
			);
		}
		process.exit(1);
	}

	let extractCode = 1;
	for (let i = 0; i < commands.length; i++) {
		const command = commands[i];
		const extract = Bun.spawn(command, {
			stdin: "inherit",
			stdout: "inherit",
			stderr: "inherit",
		});
		extractCode = await extract.exited;
		if (extractCode === 0) break;
		if (i < commands.length - 1)
			console.error(
				dim(`[Z-SCR-10-08] ${command[0]} failed, trying another extractor`),
			);
	}

	if (extractCode !== 0) {
		console.error(
			red(`[Z-SCR-10-07] Failed to extract ${file} (exit ${extractCode})`),
		);
		process.exit(1);
	}

	const zhivaDir = await findZhivaFile(zhivaTempDir);
	if (!zhivaDir) {
		console.error(red("[Z-SCR-10-03] No Zhiva file found in archive"));
		process.exit(1);
	}

	console.log(dim(`[Z-SCR-10-04] Extracted to ${zhivaDir}`));

	const targetDir = join(zhivaBaseApps, name);
	await mkdir(targetDir, {
		recursive: true,
	});

	await cp(zhivaDir, targetDir, {
		recursive: true,
	});
	await rm(zhivaTempDir, {
		recursive: true,
		force: true,
	});

	console.log(dim(`[Z-SCR-10-05] Copied ${targetDir}`));
}
