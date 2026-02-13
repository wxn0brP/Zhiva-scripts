import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { copyPkgToReqMods, installReqMods } from "./npm";

console.log("[Z-SCR-3-01] 💜 Updating Zhiva base-lib...");
if (!existsSync("node_modules/@wxn0brp/zhiva-base-lib")) {
    mkdirSync("node_modules/@wxn0brp", { recursive: true });
    await $`git clone https://github.com/wxn0brP/Zhiva-base-lib.git node_modules/@wxn0brp/zhiva-base-lib`;
}

const cwd = process.cwd();
let requireReqMods = false;

function setRequireReqMods(stdout: Buffer<ArrayBufferLike>) {
    if (requireReqMods) return;

    const output = stdout.toString();
    if (output.includes("package.json"))
        requireReqMods = true;
}

try {
    process.chdir("node_modules/@wxn0brp/zhiva-base-lib");
    const { stdout } = await $`git pull`;
    setRequireReqMods(stdout);
    copyPkgToReqMods("zhiva-base-lib");
} catch (e) {
    console.error("Error updating Zhiva base-lib:", e);
} finally {
    process.chdir(cwd);
}

console.log("[Z-SCR-3-02] 💜 Updating Zhiva scripts...");
try {
    process.chdir("scripts");
    const { stdout } = await $`git pull`;
    setRequireReqMods(stdout);
    copyPkgToReqMods("zhiva-scripts");
} finally {
    process.chdir(cwd);
}

if (requireReqMods || process.env.ZHIVA_FORCE_INSTALL_DEPS === "true") {
    console.log("[Z-SCR-3-03] 💜 Installing dependencies...");
    await installReqMods();
}

console.log("[Z-SCR-3-04] 💜 Update dependencies completed");
