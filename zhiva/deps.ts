import { $ } from "bun";
import { existsSync } from "fs";

console.log("💜 Updating Zhiva base-lib...");
if (existsSync("node_modules/@wxn0brp/zhiva-base-lib")) {
    try {
        process.chdir("node_modules/@wxn0brp/zhiva-base-lib");
        await $`git pull`;
        await $`bun install`;
    } catch { } finally {
        process.chdir("../../..");
    }
} else {
    await $`mkdir -p node_modules`;
    await $`git clone https://github.com/wxn0brP/Zhiva-base-lib.git node_modules/@wxn0brp/zhiva-base-lib`;
}

console.log("💜 Updating Zhiva scripts...");
try {
    process.chdir("scripts");
    await $`git pull`;
} finally {
    process.chdir("..");
}