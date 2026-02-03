import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { ensureAppName } from "../utils/appName";
import { db } from "../utils/db";
import { createShortCut } from "../utils/desktop";

export default async (args: string[]) => {
    console.log(args)
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

    let flags = "";

    const second = args[1];
    if (second.includes("d")) flags += "d";
    if (second.includes("m")) flags += "m";
    if (["/", "\\", "~"].some(f => second.includes(f))) flags = second;

    if (!flags.length) flags = "dm";

    let zhivaMeta = {
        name,
        icon: "default",
        win_icon: "default"
    };

    process.chdir("apps/" + name);

    if (existsSync("zhiva.json"))
        Object.assign(zhivaMeta, JSON.parse(readFileSync("zhiva.json", "utf-8")));

    createShortCut({
        name,
        appName: zhivaMeta.name,
        flags,
        icon: zhivaMeta?.icon,
        win_icon: zhivaMeta?.win_icon,
    });
}