import { getFromCache } from "../utils/cache";
import { _guessApp } from "../utils/guess";

interface Repo {
    name: string;
    desc: string;
    stars: number;
    verified?: boolean;
}

export default async (args: string[]) => {
    const name = args.find((arg) => !arg.startsWith("-")) || "";
    const jsonMode = args.includes("--json");
    const prettyMode = args.includes("--pretty");

    let apps = await getFromCache("search", 5 * 60 * 1000, fetchAllRepos);
    const banned = await getFromCache("banned", 5 * 60 * 1000, fetchBanned);

    apps = apps.filter(item => !banned.includes(item.name));
    const results = await _guessApp(name, apps.map(item => item.name));

    if (!jsonMode && !prettyMode) {
        console.log(results.join("\n"));
        return;
    }

    const verified = await getFromCache(
        "verified",
        5 * 60 * 1000,
        fetchVerified,
        [
            apps.map(item => item.name)
        ]
    );

    apps = apps.filter(item => results.includes(item.name));
    apps.forEach(item => item.verified = verified.includes(item.name));

    console.log(JSON.stringify(apps, null, prettyMode ? 2 : undefined));
}

async function fetchAllRepos(): Promise<Repo[]> {
    const data = await fetch("https://api.github.com/search/repositories?q=topic:Zhiva-app").then((res) => res.json());
    return data.items.map((item: any) => ({
        name: item.full_name,
        desc: item.description,
        stars: item.stargazers_count
    }));
}

async function fetchData(file: string) {
    const data = await fetch(`https://raw.githubusercontent.com/wxn0brP/Zhiva-registry/HEAD/${file}.txt`).then((res) => res.text());
    return data.split("\n").map(line => line.split("#")[0].trim()).filter(Boolean);
}

async function fetchBanned() {
    return await fetchData("banned");
}

async function fetchVerified(installedApps: string[]) {
    const apps = await fetchData("verified");
    apps.push(...installedApps.filter(app => app.startsWith("wxn0brP/")));
    return apps;
}