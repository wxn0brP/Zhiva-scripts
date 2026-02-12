import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";

export function chdirToApps() {
    process.chdir(`${homedir()}/.zhiva`);
    if (!existsSync("apps"))
        mkdirSync("apps", { recursive: true });
    process.chdir("apps");
}
