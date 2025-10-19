import { $ } from "bun";
import { existsSync } from "fs";

console.log("💜 Updating Zhiva base-lib...");
if (existsSync("node_modules/@wxn0brp/zhiva-base-lib")) {
    try {
        process.chdir("node_modules/@wxn0brp/zhiva-base-lib");
        await $`git pull`;
        await $`bun install --production`;
    } catch (e) {
        console.error("Error updating Zhiva base-lib:", e);
    } finally {
        process.chdir("../../..");
    }
} else {
    await $`mkdir -p node_modules`;
    await $`git clone https://github.com/wxn0brP/Zhiva-base-lib.git node_modules/@wxn0brp/zhiva-base-lib`;
    await $`cd node_modules/@wxn0brp/zhiva-base-lib && bun install --production`;
}

console.log("💜 Updating Zhiva scripts...");
const preCwd = process.cwd();
try {
    process.chdir("scripts");
    await $`git pull`;
    process.chdir("zhiva");
    await $`bun install --production`;
} finally {
    process.chdir(preCwd);
}