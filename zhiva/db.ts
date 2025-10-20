import { Valthera } from "@wxn0brp/db";
import { createLock } from "@wxn0brp/db-lock";
import { homedir } from "os";

const dbPath = homedir() + "/.zhiva/master.db";
export const db = createLock(new Valthera(dbPath));