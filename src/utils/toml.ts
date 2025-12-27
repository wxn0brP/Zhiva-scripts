export function parseToml(input: string) {
    const result: Record<string, Record<string, string>> = {};
    let currentSection = null;

    const lines = input.split(/\r?\n/);

    if (lines.length === 0)
        return result;

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const rawLine = lines[lineNumber];
        const line = rawLine.trim();

        if (line === "") continue;

        if (line.startsWith("[") && line.endsWith("]")) {
            const sectionName = line.slice(1, -1).trim();

            if (!sectionName)
                throw new Error(`Empty section name at line ${lineNumber + 1}`);

            result[sectionName] ??= {};
            currentSection = result[sectionName];
            continue;
        }

        const eqIndex = line.indexOf("=");

        if (eqIndex === -1)
            throw new Error(`Invalid line at ${lineNumber + 1}: ${rawLine}`);

        if (!currentSection)
            throw new Error(`Key-value outside section at line ${lineNumber + 1}`);

        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim().slice(1, -1);

        if (!key)
            throw new Error(`Empty key at line ${lineNumber + 1}`);

        currentSection[key] = value;
    }

    return result;
}