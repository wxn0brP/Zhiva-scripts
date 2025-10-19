import { Valthera } from "@wxn0brp/db";
import { createLock } from "@wxn0brp/db-lock";

const dbPath = (process.env.HOME ?? process.env.USERPROFILE) + "/.zhiva/master.db";
export const db = createLock(new Valthera(dbPath));