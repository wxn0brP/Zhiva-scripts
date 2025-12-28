import { getFromCache } from "../utils/cache";
import { _guessApp } from "../utils/guess";
import { parseToml } from "../utils/toml";

interface Repo {
    full_name: string;
    description: string;
    stargazers_count: number;
    verified?: boolean;
}

export default async (args: string[]) => {
    const name = args.find((arg) => !arg.startsWith("-")) || "";
    const jsonMode = args.includes("--json");

    let apps = await getFromCache("search", 5 * 60 * 1000, fetchAllRepos);
    const banned = await getFromCache("banned", 5 * 60 * 1000, fetchBanned);

    apps = apps.filter(item => !banned.includes(item.full_name));
    const results = await _guessApp(name, apps.map(item => item.full_name));

    if (!jsonMode) {
        process.stdout.write(results.join("\n"));
        return;
    }

    const verified = await getFromCache(
        "verified",
        5 * 60 * 1000,
        fetchVerified,
        [
            apps.map(item => item.full_name)
        ]
    );

    apps = apps.filter(item => results.includes(item.full_name));
    apps.forEach(item => item.verified = verified.includes(item.full_name));

    process.stdout.write(JSON.stringify(apps));
}

async function fetchAllRepos(): Promise<Repo[]> {
    const data = await fetch("https://api.github.com/search/repositories?q=topic:Zhiva-app").then((res) => res.json()) as { items: Repo[] };
    return data.items.map(item => ({
        full_name: item.full_name,
        description: item.description,
        stargazers_count: item.stargazers_count
    }));
}

async function fetchTOML(file: string) {
    const data = await fetch(`https://raw.githubusercontent.com/wxn0brP/Zhiva-registry/master/${file}.toml`).then((res) => res.text());
    return parseToml(data);
}

async function fetchBanned() {
    return Object.keys(await fetchTOML("banned"));
}

async function fetchVerified(installedApps: string[]) {
    const data = await fetchTOML("verified");
    const apps = Object.keys(data);
    apps.push(...installedApps.filter(app => app.startsWith("wxn0brP/")));
    return apps;
}