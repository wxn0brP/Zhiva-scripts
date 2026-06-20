export function ensureAppName(name: string) {
    if (!name.includes("/")) name = `wxn0brP/${name}`;
    return name;
}

export const normalizeAppId = (str: string) =>
    str
        .replaceAll("/", ".")
        .replaceAll(" ", ".")
        .replace(/\.{2,}/g, ".")
        .replace(/^\.|\.$/g, "");
