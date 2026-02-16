import { $ } from "bun";
import { existsSync } from "fs";
import { resolve } from "path";
import { ensureAppName } from "../../utils/appName";
import { InstallationStrategy } from "../types";
import { chdirToApps } from "../utils";
import { checkIsZhivaApp, clone, getConfig } from "../utils/git";

export const namedGitStrategy: InstallationStrategy = async (context) => {
    const { input } = context;
    let name = context.name || ensureAppName(input);

    chdirToApps();

    let appPath = name;
    appPath = resolve(appPath);

    if (existsSync(appPath)) {
        process.chdir(appPath);
        if (existsSync(".git"))
            await $`git pull`;
        return { name };
    } else {
        const [appName, branchParam] = input.split("#");

        const resolvedName = ensureAppName(appName);
        const [repo, branch] = branchParam
            ? [resolvedName, branchParam]
            : await getConfig(resolvedName);

        if (!(await checkIsZhivaApp(repo))) {
            console.error(`[Z-SCR-5-03] 💔 App ${repo} is not a valid zhiva app`);
            process.exit(1);
        }

        await clone(`https://github.com/${repo}.git`, name, branch);

        return {
            name,
            dir: appPath,
        };
    }
}
