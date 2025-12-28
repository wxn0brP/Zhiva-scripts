import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { ensureAppName } from "../utils/appName";
import { db } from "../utils/db";
import { createShortCut } from "../utils/desktop";

export default async (args: string[]) => {
    let name = args[0];
    if (!name) {
        console.error("Please provide an app name");
        process.exit(1);
    }

    name = ensureAppName(name);

    process.chdir(`${homedir()}/.zhiva`);
    const appData = await db.findOne("apps", { name });
    if (!appData) {
        console.error(`App ${name} is not installed`);
        process.exit(1);
    }

    let desktopTypes: string[] = [];

    if (args.includes("--desktop") || args.includes("-d")) desktopTypes.push("desktop");
    if (args.includes("--share") || args.includes("-s")) desktopTypes.push("share");

    if (desktopTypes.length === 0) desktopTypes = ["share", "desktop"];

    let zhivaMeta = {
        name,
        icon: "default",
        win_icon: "default"
    };

    const zhivaJson = `${homedir()}/.zhiva/apps/${name}/zhiva.json`;
    if (existsSync(zhivaJson))
        Object.assign(zhivaMeta, JSON.parse(readFileSync(zhivaJson, "utf-8")));

    for (const path of desktopTypes) {
        createShortCut({
            name,
            appName: zhivaMeta.name,
            path,
            icon: zhivaMeta?.icon,
            win_icon: zhivaMeta?.win_icon,
        });
    }
}