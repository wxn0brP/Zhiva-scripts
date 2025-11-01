import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { copyPkgToReqMods, installReqMods } from "./npm";

console.log("[Z-SCR-3-01] 💜 Updating Zhiva base-lib...");
if (!existsSync("node_modules/@wxn0brp/zhiva-base-lib")) {
    mkdirSync("node_modules/@wxn0brp", { recursive: true });
    await $`git clone https://github.com/wxn0brP/Zhiva-base-lib.git node_modules/@wxn0brp/zhiva-base-lib`;
}

const cwd = process.cwd();
try {
    process.chdir("node_modules/@wxn0brp/zhiva-base-lib");
    await $`git pull`;
    copyPkgToReqMods("zhiva-base-lib");
} catch (e) {
    console.error("Error updating Zhiva base-lib:", e);
} finally {
    process.chdir(cwd);
}

console.log("[Z-SCR-3-02] 💜 Updating Zhiva scripts...");
try {
    process.chdir("scripts");
    await $`git pull`;
    process.chdir("zhiva");
    copyPkgToReqMods("zhiva-scripts");
} finally {
    process.chdir(cwd);
}
await installReqMods();
console.log("[Z-SCR-3-03] 💜 Update dependencies completed");