import { execSync } from "child_process";
import { chmodSync, writeFileSync } from "fs";
import { join, resolve } from "path";

export interface Opts {
    name: string;
    appName?: string;
    icon?: string;
    path?: string;
}

export function createDesktopFile(opts: Opts) {
    const bunPath = execSync("which bun").toString().trim();
    let shortName = opts.appName || opts.name;
    shortName = shortName.split("/").pop();

    const desktop = `
[Desktop Entry]
Type=Application
Name=${shortName}
Exec=${bunPath} run ${process.env.HOME}/.zhiva/bin/zhiva-startup ${opts.name}
${opts.icon && `Icon=${resolve(opts.icon)}`}
`.trim();
    let path = opts.path || "share";
    switch (path) {
        case "share":
            path = `${process.env.HOME}/.local/share/applications`;
            break;
        case "desktop":
            path = execSync("xdg-user-dir DESKTOP").toString().trim();
            break;
    }

    const filePath = join(path, `${shortName}.desktop`);
    writeFileSync(filePath, desktop);
    chmodSync(filePath, 0o755);
    console.log(`💜 Desktop file created at ${filePath}`);
}