import { getFromCache } from "../utils/cache";
import { _guessApp } from "../utils/guess";

export default async (args: string[]) => {
    const name = args[0];
    if (!name) {
        console.error("Please provide an app name");
        process.exit(1);
    }

    const apps = await getFromCache("search", 5 * 60 * 1000, fetchData);
    const results = await _guessApp(name, apps);

    process.stdout.write(results.join("\n"));
}

async function fetchData() {
    const data = await fetch("https://api.github.com/search/repositories?q=topic:Zhiva-app").then((res) => res.json())
    return data.items.map((item: any) => item.full_name);
}