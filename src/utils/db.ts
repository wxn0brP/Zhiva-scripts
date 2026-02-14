import { createLock } from "@wxn0brp/db-lock";
import { homedir } from "os";
import { ValtheraCreate } from "@wxn0brp/db";
import { CacheEntry } from "./cache";
import { Preference } from "./pref";

type DB = {
    apps: {
        name: string;
        updatedAt: number;
        _id: string;
    };
    cache: CacheEntry;
    pref: Preference;
}

const dbPath = homedir() + "/.zhiva/master.db";
export const db = createLock(ValtheraCreate<DB>(dbPath), {
    retryTime: 100,
    retryCount: 200
});
