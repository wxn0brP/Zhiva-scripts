import { getFromCache } from "../utils/cache";
import { _guessApp } from "../utils/guess";
import { parseToml } from "../utils/toml";

export default async (args: string[]) => {
    const name = args[0];
    const apps = await getFromCache("search", 5 * 60 * 1000, fetchAllRepos);
    const banned = await getFromCache("banned", 5 * 60 * 1000, fetchBanned);

    apps.filter((item: any) => !banned[item.full_name]);
    const results = await _guessApp(name, apps.map((item: any) => item.full_name));

    if (!args.includes("--json")) {
        process.stdout.write(results.join("\n"));
        return;
    }

    const verified = await getFromCache("verified", 5 * 60 * 1000, fetchVerified, apps);
    apps.filter((item: any) => results.includes(item.full_name));
    apps.forEach((item: any) => {
        item.verified = verified[item.full_name];
    });

    process.stdout.write(JSON.stringify(apps));
}

async function fetchAllRepos() {
    const data = await fetch("https://api.github.com/search/repositories?q=topic:Zhiva-app").then((res) => res.json())
    return data.items.map((item: any) => ({
        full_name: item.full_name,
        description: item.description
    }));
}

async function fetchTOML(file: string) {
    const data = await fetch(`https://raw.githubusercontent.com/wxn0brP/Zhiva-registry/master/${file}.toml`).then((res) => res.text());
    return parseToml(data);
}

async function fetchBanned() {
    return await fetchTOML("banned");
}

async function fetchVerified(apps: string[]) {
    const data = await fetchTOML("verified");
    apps.filter(app => app.startsWith("wxn0brP/")).forEach(app => {
        data[app] = {
            at: new Date().toISOString().slice(0, 10),
        };
    });
    return data;
}