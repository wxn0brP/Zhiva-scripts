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

    apps.filter((item: any) => results.includes(item.full_name));
    process.stdout.write(JSON.stringify(apps));
}

async function fetchAllRepos() {
    const data = await fetch("https://api.github.com/search/repositories?q=topic:Zhiva-app").then((res) => res.json())
    return data.items.map((item: any) => ({
        full_name: item.full_name,
        description: item.description
    }));
}

async function fetchBanned() {
    const data = await fetch(`https://raw.githubusercontent.com/wxn0brP/Zhiva-registry/master/banned.toml`).then((res) => res.text());
    return parseToml(data);
}