import { execSync } from "child_process";
import { chmodSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { homedir, tmpdir } from "os";
import { join, resolve } from "path";

export interface Opts {
    name: string;
    appName?: string;
    icon?: string;
    win_icon?: string;
    flags?: string;
}

function getShortName(opts: Opts) {
    let name = opts.appName || opts.name;
    return name.split("/").pop();
}

export function createDesktopFile(opts: Opts) {
    const bunPath = execSync("which bun").toString().trim();
    const shortName = getShortName(opts);
    let icon = opts.icon;
    if (icon === "default") {
        icon = `${process.env.HOME}/.zhiva/node_modules/@wxn0brp/zhiva-base-lib/assets/zhiva.png`;
    } else if (icon) {
        icon = downloadFileIsNeeded(icon);
        icon = resolve(icon);
    }

    const desktop = `
[Desktop Entry]
Type=Application
Name=${shortName}
Exec=${bunPath} run ${process.env.HOME}/.zhiva/bin/zhiva start ${opts.name}
${icon ? `Icon=${icon}` : ""}
`.trim();

    let paths = [];
    const flags = opts.flags || "m";
    if (flags.includes("m")) paths.push(join(homedir(), ".local/share/applications"));
    if (flags.includes("d")) paths.push(execSync("xdg-user-dir DESKTOP").toString().trim());
    if (flags.startsWith("/")) paths = [flags];

    for (const path of paths) {
        const filePath = join(path, `${shortName}.desktop`);
        writeFileSync(filePath, desktop);
        chmodSync(filePath, 0o755);
    }
    return paths;
}

export function createLnkFile(opts: Opts) {
    const shortName = getShortName(opts);

    let paths = [];
    const flags = opts.flags || "m";
    if (flags.includes("m"))
        paths.push(join(
            process.env.APPDATA!,
            "Microsoft",
            "Windows",
            "Start Menu",
            "Programs"
        ));
    if (flags.includes("d")) {
        const desktopPath = execSync(
            "powershell -NoProfile -Command \"[Environment]::GetFolderPath('Desktop')\"",
            { encoding: "utf-8" }
        ).trim();
        paths.push(desktopPath);
    }
    if (flags.includes("/") || flags.includes("\\")) paths = [flags];

    for (const path of paths) {
        if (!existsSync(path)) mkdirSync(path, { recursive: true });

        const shortcutPath = join(path, `${shortName}.lnk`);
        let iconPath = opts.win_icon;
        if (iconPath === "default") {
            iconPath = `${homedir()}/.zhiva/node_modules/@wxn0brp/zhiva-base-lib/assets/zhiva.ico`;
        } else if (iconPath) {
            iconPath = downloadFileIsNeeded(iconPath);
            iconPath = resolve(iconPath);
        }

        const psContent = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${shortcutPath}')
$Shortcut.TargetPath = "$env:ComSpec"
$Shortcut.Arguments = "/c set _ZHIVA_BG=1 && %USERPROFILE%\\.zhiva\\bin\\zhiva.cmd start ${opts.name}"
${iconPath ? `$Shortcut.IconLocation = '${iconPath}'` : ""}
$Shortcut.WindowStyle = 7
$Shortcut.Save()
`.trim();

        const tmpFile = join(tmpdir(), `zhiva_shortcut_${Date.now()}.ps1`);
        writeFileSync(tmpFile, psContent, "utf8");

        try {
            execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, {
                stdio: "inherit",
            });
        } finally {
            unlinkSync(tmpFile);
        }

    }
    return paths;
}

export function downloadFileIsNeeded(url: string) {
    if (!url.startsWith("http")) return url;
    const fileName = url.split("/").pop();
    if (existsSync(fileName)) return fileName;

    execSync(`curl -o ${fileName} ${url}`);

    return fileName;
}

export function createShortCut(opts: Opts) {
    let paths: string[];
    switch (process.platform) {
        case "linux":
        case "darwin":
            paths = createDesktopFile(opts);
            break;
        case "win32":
            paths = createLnkFile(opts);
            break;
        default:
            console.error("[Z-SCR-1-02] 💔 Shortcuts are not supported on this platform");
    }
    if (paths.length)
        console.log(`[Z-SCR-1-01] 💜 Shortcuts created for ${opts.name}:\n- ${paths.join("\n- ")}`);
}