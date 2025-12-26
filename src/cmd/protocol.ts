import { spawn } from "bun";

export default async (args: string[]) => {
    if (!args.length) {
        console.log("[Z-SCR-9-01] Usage: zhiva protocol <url>");
        process.exit(1);
    }

    const rawArg = args[0];
    if (!rawArg.startsWith("zhiva://")) {
        console.error("[Z-SCR-9-02] Invalid protocol");
        process.exit(1);
    }

    const [command, ...urlArgs] = rawArg.slice("zhiva://".length).split("/");
    const arg = urlArgs.join("/");

    console.log(`[Z-SCR-9-03] 💜 Executing ${command} ${arg}...`);
    process.argv.splice(2, 1);

    const supportedCommands = ["start", "install", "open"];
    if (!supportedCommands.includes(command)) {
        console.error("Invalid command");
        process.exit(1);
    }

    const spawnArgs = [
        process.argv[0],
        "run",
        process.argv[1],
        command,
        arg
    ];

    console.log(`[z-SRC-9-04] 💜 Executing`, spawnArgs);
    spawn(spawnArgs);
}