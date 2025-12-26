import { guessApp } from "../utils/guess";

export default async (args: string[]) => {
    const name = (args[0] || "").trim();
    const results = await guessApp(name);
    process.stdout.write(results.join("\n"));
}