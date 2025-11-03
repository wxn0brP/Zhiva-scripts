export async function interactiveSelect(options: string[]): Promise<string | null> {
    if (options.length === 0) {
        return Promise.resolve(null);
    }
    options = options.filter(o => o.includes("/"));

    return new Promise(resolve => {
        const stdin = process.stdin;

        const cleanup = () => {
            stdin.removeListener("data", onData);
            if (stdin.isRaw) stdin.setRawMode(false);
            stdin.pause();
        };

        let onData: (key: string) => void;

        if (options.length === 1) {
            process.stdout.write(`[Z-SCR-2-05] App not found. Did you mean "${options[0]}"? [Y/n] `);

            onData = (key: string) => {
                const k = key.toLowerCase();
                if (k === "y" || key === "\r") { // Enter
                    process.stdout.write("\n");
                    cleanup();
                    resolve(options[0]);
                } else if (k === "n" || key === "\u0003") { // Ctrl+C
                    process.stdout.write("\nAborted.\n");
                    cleanup();
                    resolve(null);
                }
            };
        } else {
            let selectedIndex = 0;
            let hasRendered = false;
            options.push("Cancel");

            const render = () => {
                if (hasRendered) {
                    for (let i = 0; i < options.length + 1; i++) {
                        process.stdout.write("\u001b[1A\u001b[K");
                    }
                }
                hasRendered = true;

                process.stdout.write(`[Z-SCR-2-06] App not found. Did you mean one of these? (Use arrows, Enter to select)\n`);
                options.forEach((option, i) => {
                    const isSelected = i === selectedIndex;
                    const prefix = isSelected ? "> " : "  ";
                    process.stdout.write(`${prefix}${option}\n`);
                });
            };

            onData = (key: string) => {
                if (key === "\u0003") { // Ctrl+C
                    cleanup();
                    process.stdout.write("\nAborted.\n");
                    resolve(null);
                    return;
                }
                if (key === "\r") { // Enter
                    cleanup();
                    for (let i = 0; i < options.length + 1; i++) {
                        process.stdout.write("\u001b[1A\u001b[K");
                    }
                    resolve(options[selectedIndex]);
                    return;
                }

                if (key === "\u001b[A") { // Up arrow
                    selectedIndex = (selectedIndex > 0) ? selectedIndex - 1 : options.length - 1;
                } else if (key === "\u001b[B") { // Down arrow
                    selectedIndex = (selectedIndex < options.length - 1) ? selectedIndex + 1 : 0;
                }
                render();
            };

            render();
        }

        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");
        stdin.on("data", onData);
    });
}