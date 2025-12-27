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
    const name = args[0];
    const apps = await getFromCache<Repo[]>("search", 5 * 60 * 1000, fetchAllRepos);
    const banned = await getFromCache<string[]>("banned", 5 * 60 * 1000, fetchBanned);

    apps.filter(item => !banned.includes(item.full_name));
    const results = await _guessApp(name, apps.map((item: any) => item.full_name));

    if (!args.includes("--json")) {
        process.stdout.write(results.join("\n"));
        return;
    }

    const verified = await getFromCache<string[]>("verified", 5 * 60 * 1000, fetchVerified, apps.map((item: any) => item.full_name));
    apps.filter(item => results.includes(item.full_name));
    apps.forEach(item => item.verified = verified.includes(item.full_name));

    process.stdout.write(JSON.stringify(apps));
}

async function fetchAllRepos() {
    const data = await fetch("https://api.github.com/search/repositories?q=topic:Zhiva-app").then((res) => res.json())
    return data.items.map((item: any) => ({
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