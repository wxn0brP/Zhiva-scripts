import JSON5 from "json5";
import { db } from "../utils/db";

export default async (args: string[]) => {
    args = args.map((arg) => arg.startsWith("{") || arg.startsWith("[") ? JSON5.parse(arg) : arg);

    const res = await db[args[0]](...args.slice(1));
    console.log(JSON.stringify(res, null, 2));
};