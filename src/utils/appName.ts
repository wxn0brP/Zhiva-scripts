export function ensureAppName(name: string) {
    if (!name.includes("/")) name = `wxn0brP/${name}`;
    return name;
}