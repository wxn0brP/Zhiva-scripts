import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";

console.log("[Z-SCR-3-01] 💜 Updating Zhiva base-lib...");
if (!existsSync("node_modules/@wxn0brp/zhiva-base-lib")) {
    mkdirSync("node_modules/@wxn0brp", { recursive: true });
    await $`git clone https://github.com/wxn0brP/Zhiva-base-lib.git node_modules/@wxn0brp/zhiva-base-lib`;
}

try {
    process.chdir("node_modules/@wxn0brp/zhiva-base-lib");
    await $`git pull`;
    await $`bun install --production`;
} catch (e) {
    console.error("Error updating Zhiva base-lib:", e);
} finally {
    process.chdir("../../..");
}

console.log("[Z-SCR-3-02] 💜 Updating Zhiva scripts...");
const preCwd = process.cwd();
try {
    process.chdir("scripts");
    await $`git pull`;
    process.chdir("zhiva");
    await $`bun install --production`;
} finally {
    process.chdir(preCwd);
}
console.log("[Z-SCR-3-03] 💜 Update dependencies completed");