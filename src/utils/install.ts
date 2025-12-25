import { $ } from "bun";

export async function getConfig(name: string) {
    let branch: string | undefined = undefined;
    let cloneName = name;

    try {
        let configBranch = "HEAD";
        let configPath = "zhiva.json";
        const maxRedirects = 15;

        for (let i = 0; i < maxRedirects; i++) {
            if (i === maxRedirects - 1) {
                console.error("Exceeded max redirects while resolving config.");
                break;
            };

            const res = await fetch(`https://raw.githubusercontent.com/${cloneName}/${configBranch}/${configPath}`);
            if (!res.ok) break;
            const tempConfig = await res.json().catch(() => ({}));

            if (tempConfig.redirect_repo) {
                console.log(`Redirecting from "${cloneName}" to "${tempConfig.redirect_repo}"...`);
                name = tempConfig.redirect_repo;
                cloneName = tempConfig.redirect_repo;
                configBranch = "HEAD";
                configPath = "zhiva.json";
                continue;
            }

            if (tempConfig.redirect_zhiva) {
                const [newPath, newBranch] = tempConfig.redirect_zhiva.split("#");
                configPath = newPath.startsWith("./") ? newPath.slice(2) : newPath;
                if (newBranch) configBranch = newBranch;
                console.log(`Redirecting zhiva.json to "${tempConfig.redirect_zhiva}"...`);
                continue;
            }

            branch = tempConfig.branch;
            break;
        }
    } catch (e) {
        console.error("Error resolving zhiva config:", e.message);
    }

    return [cloneName, branch];
}

export async function clone(cloneUrl: string, name: string, branch = "") {
    if (branch) {
        await $`git clone -b ${branch} ${cloneUrl} ${name}`;
    } else {
        await $`git clone ${cloneUrl} ${name}`;
    }
}