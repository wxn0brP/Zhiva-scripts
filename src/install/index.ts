import {
    archiveStrategy,
    httpGitStrategy,
    isArchiveInput,
    isHttpGitInput,
    namedGitStrategy,
} from "./strategy";
import { InstallationContext, InstallationStrategy } from "./types";

function getStrategy(input: string) {
    const strategies: Array<[(input: string) => boolean, InstallationStrategy]> = [
        [isArchiveInput, archiveStrategy],
        [isHttpGitInput, httpGitStrategy],
        // fallback - default strategy
        [() => true, namedGitStrategy],
    ];

    for (const [condition, strategy] of strategies) {
        if (condition(input)) {
            return strategy;
        }
    }
}

export async function ensueFiles(input: string) {
    const prevCwd = process.cwd();
    const context: InstallationContext = {
        input,
        previousCwd: prevCwd,
    };

    const strategy = getStrategy(input);

    return await strategy(context);
}
