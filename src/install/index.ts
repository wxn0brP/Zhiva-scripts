import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { rm } from "fs/promises";
import { homedir } from "os";
import { extname, join, parse, resolve } from "path";
import { ensureAppName } from "../utils/appName";
import { extensions as archiveExtensions, downloadAndExtract } from "./archive";
import { checkIsZhivaApp, clone, getConfig } from "./git.utils";

export async function ensueFiles(input: string) {
    let name = ensureAppName(input);
    const prevCwd = process.cwd();

    process.chdir(`${homedir()}/.zhiva`);
    if (!existsSync("apps")) mkdirSync("apps", { recursive: true });
    process.chdir("apps");

    let appPath = name;
    const extension = extname(input);
    if (appPath.startsWith("http")) {
        appPath = new URL(input).pathname.split("/").slice(-2).join("/");
        appPath = parse(appPath).name;
    } else if (archiveExtensions.includes(extension)) {
        name = "archive/" + parse(input).name;
        appPath = name;
    }
    appPath = resolve(appPath);

    if (existsSync(appPath)) {
        process.chdir(appPath);
        if (existsSync(".git"))
            await $`git pull`;
        return { name };
    } else {

        if (input.startsWith("http") && input.endsWith(".git")) {
            const split = input.split("#"); // name # branch
            name = split[0].split("/").slice(-2).join("/").replace(".git", "");
            appPath = resolve(name);

            await clone(split[0], name, split[1]);
            if (!existsSync(join(appPath, "zhiva.json"))) {
                console.error(`[Z-SCR-6-01] 💔 App ${appPath} is not a valid zhiva app`);
                await rm(appPath, { force: true, recursive: true });
                process.exit(1);
            }


        } else if (archiveExtensions.includes(extension)) {
            name = "archive/" + await downloadAndExtract(input, prevCwd);

        } else {
            let branch: string;
            [name, branch] = input.split("#");
            name = ensureAppName(name);
            if (!branch)
                [name, branch] = await getConfig(ensureAppName(input));

            if (!await checkIsZhivaApp(name)) {
                console.error(`[Z-SCR-5-03] 💔 App ${name} is not a valid zhiva app`);
                process.exit(1);
            }

            await clone(`https://github.com/${name}.git`, name, branch);
        }
    }

    return {
        name,
        dir: appPath,
    }
}
