import { $ } from "bun";
import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    writeFileSync
} from "fs";
import { homedir } from "os";
import { join } from "path";

const zhivaDir = join(homedir(), ".zhiva");
const dir = join(zhivaDir, "req-mods");

if (!existsSync(zhivaDir)) mkdirSync(zhivaDir);
if (!existsSync(dir)) mkdirSync(dir);

function normalizeVersion(v: string): string {
    return v
        .trim()
        .replace(/^[\^~><=\s*v]+/, "")
        .split(/[-+]/)[0];
}

function isSemver(v: string): boolean {
    return /^\d+(\.\d+){0,2}$/.test(normalizeVersion(v));
}

function compareVersions(a: string, b: string): number {
    const pa = normalizeVersion(a).split(".").map(n => parseInt(n, 10) || 0);
    const pb = normalizeVersion(b).split(".").map(n => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        if (pa[i] > pb[i]) return 1;
        if (pa[i] < pb[i]) return -1;
    }
    return 0;
}

function isSpecial(v: string): boolean {
    return /^(git\+|file:|github:|workspace:|http|https)/.test(v);
}

export function copyPkgToReqMods(name: string, file = "package.json") {
    const pkg = JSON.parse(readFileSync(file, "utf-8"));
    const deps = Object.assign({}, pkg.dependencies || {}, pkg.peerDependencies || {});
    const lines = Object.entries(deps)
        .map(([dep, version]) => `${dep},${version}`)
        .join("\n");
    writeFileSync(`${dir}/${name}`, lines);
}

export async function installReqMods() {
    const pwd = process.cwd();
    process.chdir(zhivaDir);

    const files = readdirSync(dir);
    const deps: Record<string, string> = {};

    for (const file of files) {
        const data = readFileSync(`${dir}/${file}`, "utf-8");
        for (const line of data.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const [name, versionRaw] = trimmed.split(",");
            const version = versionRaw?.trim() || "*";
            const existing = deps[name];

            if (!existing) {
                deps[name] = version;
                continue;
            }

            if (version === "*" || version === "latest") {
                deps[name] = version;
                continue;
            }
            if (existing === "*" || existing === "latest") {
                continue;
            }

            const specialA = isSpecial(existing);
            const specialB = isSpecial(version);
            if (specialA && !specialB) {
                deps[name] = version;
                continue;
            }
            if (!specialA && specialB) {
                continue;
            }

            if (isSemver(version) && isSemver(existing)) {
                if (compareVersions(version, existing) > 0) {
                    deps[name] = version;
                }
                continue;
            }

            deps[name] = version;
        }
    }

    writeFileSync(
        "package.json",
        JSON.stringify({ dependencies: deps }, null, 2)
    );

    await $`bun install --production --force`;
    process.chdir(pwd);
}
