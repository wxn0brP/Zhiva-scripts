export async function interactiveAppSelect(apps: string[]): Promise<string | null> {
    if (apps.length === 0)
        return Promise.resolve(null);

    if (apps.length === 1)
        return Promise.resolve(apps[0]);

    apps = apps.filter(o => o.includes("/"));

    return new Promise(resolve => {
        const stdin = process.stdin;

        const cleanup = () => {
            stdin.removeListener("data", onData);
            if (stdin.isRaw) stdin.setRawMode(false);
            stdin.pause();
        };

        let selectedIndex = 0;
        let hasRendered = false;
        apps.push("Cancel");

        const render = () => {
            if (hasRendered) {
                for (let i = 0; i < apps.length + 1; i++) {
                    process.stdout.write("\u001b[1A\u001b[K");
                }
            }
            hasRendered = true;

            process.stdout.write(`[Z-SCR-2-06] App not found. Did you mean one of these? (Use arrows, Enter to select)\n`);
            apps.forEach((option, i) => {
                const isSelected = i === selectedIndex;
                const prefix = isSelected ? "> " : "  ";
                process.stdout.write(`${prefix}${option}\n`);
            });
        };

        const onData = (key: string) => {
            if (key === "\u0003") { // Ctrl+C
                cleanup();
                process.stdout.write("\nAborted.\n");
                resolve(null);
                return;
            }
            if (key === "\r") { // Enter
                cleanup();
                for (let i = 0; i < apps.length + 1; i++) {
                    process.stdout.write("\u001b[1A\u001b[K");
                }
                resolve(apps[selectedIndex]);
                return;
            }

            if (key === "\u001b[A") { // Up arrow
                selectedIndex = (selectedIndex > 0) ? selectedIndex - 1 : apps.length - 1;
            } else if (key === "\u001b[B") { // Down arrow
                selectedIndex = (selectedIndex < apps.length - 1) ? selectedIndex + 1 : 0;
            }
            render();
        };

        render();

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");
        stdin.on("data", onData);
    });
}
