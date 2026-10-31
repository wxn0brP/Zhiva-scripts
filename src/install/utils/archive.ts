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

export async function downloadAndExtract(
	urlOrFile: string,
	previousCwd: string,
	name: string,
) {
	const isUrl = urlOrFile.startsWith("http");
	const file = isUrl
		? await downloadFileIsNeeded(urlOrFile)
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

	const extractor = extensionsCmd[extension][0];
	if (!Bun.which(extractor)) {
		console.error(
			red(
				`[Z-SCR-10-06] ${extractor} is required to extract ${extension} archives`,
			),
		);
		process.exit(1);
	}

	const extract = Bun.spawn(
		[
			...extensionsCmd[extension],
			file,
		],
		{
			stdin: "inherit",
			stdout: "inherit",
			stderr: "inherit",
		},
	);
	const extractCode = await extract.exited;
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
