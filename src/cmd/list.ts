import { db } from "../utils/db";

const apps = await db.apps.find();

export default (args: string[]) => {
    const json = args.includes("--json");

    if (!apps.length)
        return console.log(json ? "[]" : "No apps installed");


    if (json)
        return console.log(JSON.stringify(apps.map((app) => app.name)));

    console.log("Installed apps:");
    for (const app of apps) {
        console.log(`- ${app.name}`);
    }
}
