import { loadJson } from "@wxn0brp/zhiva-base-lib/json";
import { app, oneWindow } from "@wxn0brp/zhiva-base-lib/server";

const zhiva = loadJson("zhiva.json") as {
    static: {
        dirs: Record<string, string>;
        files: Record<string, string>;
        redirects: Record<string, string>;
    }
};

const redirects = zhiva.static.redirects || {};
for (const [url, path] of Object.entries(redirects)) {
    app.get(url, (_, res) => res.redirect(path));
}

const files = zhiva.static.files || {};
for (const [url, path] of Object.entries(files)) {
    app.get(url, (_, res) => res.sendFile(path));
}

const dirs = zhiva.static.dirs || { "/": "." };

for (const [url, path] of Object.entries(dirs)) {
    app.static(url, path);
}

oneWindow();