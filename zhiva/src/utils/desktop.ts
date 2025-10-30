import { execSync } from "child_process";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";

export interface Opts {
    name: string;
    appName?: string;
    icon?: string;
    win_icon?: string;
    path?: string;
}

function getShortName(opts: Opts) {
    let name = opts.appName || opts.name;
    return name.split("/").pop();
}

export function createDesktopFile(opts: Opts) {
    const bunPath = execSync("which bun").toString().trim();
    const shortName = getShortName(opts);

    const desktop = `
[Desktop Entry]
Type=Application
Name=${shortName}
Exec=${bunPath} run ${process.env.HOME}/.zhiva/bin/zhiva start ${opts.name}
${opts.icon ? `Icon=${resolve(opts.icon)}` : ""}
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
    return filePath;
}

export function createLnkFile(opts: Opts) {
    const shortName = getShortName(opts);
    const bunPath = execSync("where bun").toString().trim();

    let path = opts.path || "desktop";
    switch (path) {
        case "share":
            path = join(
                process.env.APPDATA!,
                "Microsoft",
                "Windows",
                "Start Menu",
                "Programs"
            );
            break;
        case "desktop":
            path = join(homedir(), "Desktop");
            break;
        default:
            path = resolve(path);
    }

    if (!existsSync(path)) mkdirSync(path, { recursive: true });

    const shortcutPath = join(path, `${shortName}.lnk`);
    const iconPath = opts.win_icon ? resolve(opts.win_icon) : "";

    const ps = `
$WshShell = New-Object -ComObject WScript.Shell;
$Shortcut = $WshShell.CreateShortcut('${shortcutPath}');
$Shortcut.TargetPath = '${bunPath}';
$Shortcut.Arguments = 'run "${process.env.USERPROFILE}\\.zhiva\\bin\\zhiva start" ${opts.name}';
${iconPath ? `$Shortcut.IconLocation = '${iconPath}';` : ""}
$Shortcut.Save();
`.trim().split("\n").join(" ");
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`);
    return shortcutPath;
}

export function createShortCut(opts: Opts) {
    let path: string;
    switch (process.platform) {
        case "linux":
        case "darwin":
            path = createDesktopFile(opts);
            break;
        case "win32":
            path = createLnkFile(opts);
            break;
        default:
            console.error("[Z-SCR-1-02] 💔 Shortcuts are not supported on this platform");
    }
    if (path)
        console.log(`[Z-SCR-1-01] 💜 Shortcut created at ${path}`);
}