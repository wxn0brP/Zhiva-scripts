import { writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

process.chdir(join(homedir(), ".zhiva"));
process.env.ZHIVA_FORCE_INSTALL_DEPS = "true";
for (const name of ["deps", "engine"]) {
    await import("../utils/" + name);
}
writeFileSync("latest-check", String(Date.now()));
console.log("[Z-SCR-7-01] 💜 Update completed");

export default () => { }
