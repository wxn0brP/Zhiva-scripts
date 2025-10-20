import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync } from "fs";

const platform = process.platform;
const baseLink = "https://github.com/wxn0brP/Zhiva-native/releases/download/native/";
const nv = "zhiva.nv.txt";

export async function checkEngine() {
    try {
        const serverVersion = await fetch(baseLink + nv).then(res => res.text());
        if (existsSync(nv) && readFileSync(nv, "utf-8").trim() === serverVersion.trim()) {
            return console.log("[Z-SCR-4-01] Zhiva is up to date");
        }

        console.log("[Z-SCR-4-02] Downloading Zhiva...");
        await $`curl -L ${baseLink}zhiva-${platform} -o zhiva`;
        writeFileSync(nv, serverVersion);
        if (platform !== "win32") await $`chmod +x zhiva`;
    } catch (e) {
        console.error("Error downloading/updating Zhiva:", e);
        if (!existsSync("zhiva")) process.exit(1);
    }
}

console.log("[Z-SCR-4-03] 💜 Updating Zhiva engine...");
await checkEngine();