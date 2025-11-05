import { db } from "./db";

export async function guessApp(name: string): Promise<string[]> {
    const pkgs = await db.find("apps");
    const names = pkgs.map((pkg) => pkg.name);

    const all = [...names];
    for (const pkg of names) {
        if (pkg.startsWith("wxn0brP/")) {
            all.push(pkg.replace("wxn0brP/", ""));
        }
    }

    if (!name) {
        return all;
    }

    const fuzzyMatch = (query: string, text: string) => {
        query = query.toLowerCase();
        text = text.toLowerCase();

        let i = 0;
        for (const char of text) {
            if (char === query[i]) i++;
            if (i === query.length) return true;
        }
        return false;
    }

    const filtered = all
        .filter((n) => fuzzyMatch(name, n))
        .sort((a, b) => a.length - b.length);

    return filtered;
}