import { $ } from "bun";
import { existsSync } from "fs";
import { resolve } from "path";
import { ensureAppName } from "../../utils/appName";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { checkIsZhivaApp, clone, getConfig } from "../utils/git";

export const namedGitStrategy: InstallationStrategy = async (context) => {
    const { input } = context;
    let name = ensureAppName(input);

    chdirToApps();

    let appPath = name;
    appPath = resolve(appPath);

    if (existsSync(appPath)) {
        process.chdir(appPath);
        if (existsSync(".git"))
            await $`git pull`;
        return { name };
    } else {
        let branch: string;
        const [appName, branchParam] = input.split("#");

        const resolvedName = ensureAppName(appName);
        [name, branch] = branchParam
            ? [resolvedName, branchParam]
            : await getConfig(resolvedName);

        if (!(await checkIsZhivaApp(name))) {
            console.error(`[Z-SCR-5-03] 💔 App ${name} is not a valid zhiva app`);
            process.exit(1);
        }

        await clone(`https://github.com/${name}.git`, name, branch);

        return {
            name,
            dir: appPath,
        };
    }
}
