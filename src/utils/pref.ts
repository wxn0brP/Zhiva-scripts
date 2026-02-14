import { db } from "./db";

export interface Preference<T = any> {
    _id: string;
    v: T;
}

export async function getPref<T = any>(name: string): Promise<T> {
    const pref = await db.pref.findOne({ _id: name });
    return pref?.v;
}
