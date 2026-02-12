import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { cp, readdir, rm } from "fs/promises";
import { homedir } from "os";
import { dirname, extname, join, parse } from "path";

export const extensions = [
    ".zip",
    ".tar.gz",
    ".tar.bz2",
    ".tar.xz",
    ".7z",
];

export const commands = {
    ".zip": "unzip",
    ".tar.gz": "tar -xvf",
    ".tar.bz2": "tar -xvf",
    ".tar.xz": "tar -xvf",
    ".7z": "7z x",
};

async function downloadFileIsNeeded(rawUrl: string) {
    const url = new URL(rawUrl);
    const fileName = url.pathname.split("/").pop();

    if (existsSync(fileName)) return fileName;

    await $`curl -o ${fileName} ${rawUrl}`;
    return fileName;
}

async function findZhivaFile(path: string) {
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

export async function downloadAndExtract(urlOrFile: string, prevCwd: string) {
    const isUrl = urlOrFile.startsWith("http");
    const file = isUrl ? await downloadFileIsNeeded(urlOrFile) : join(prevCwd, urlOrFile);

    if (!existsSync(file)) {
        console.error("[Z-SCR-10-01] File not found at", file);
        process.exit(1);
    }

    const { name, ext: extension } = parse(file);

    if (!extensions.includes(extension)) {
        console.error("[Z-SCR-10-02] Invalid file extension:", extension);
        process.exit(1);
    }

    const zhivaBaseApps = join(homedir(), ".zhiva", "apps", "archive");
    const zhivaTempDir = join(zhivaBaseApps, "temp");

    if (existsSync(zhivaTempDir))
        await rm(zhivaTempDir, { recursive: true, force: true });

    mkdirSync(zhivaTempDir, { recursive: true });

    process.chdir(zhivaTempDir);
    await $`${commands[extension]} ${file}`;

    const zhivaDir = await findZhivaFile(zhivaTempDir);
    if (!zhivaDir) {
        console.error("[Z-SCR-10-03] No Zhiva file found in archive");
        process.exit(1);
    }

    console.log(`[Z-SCR-10-04] Extracted to ${zhivaDir}`);

    await cp(zhivaDir, join(zhivaBaseApps, name), { recursive: true });
    await rm(zhivaTempDir, { recursive: true, force: true });

    return name;
}
