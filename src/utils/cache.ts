import { db } from "./db";

export interface CacheEntry {
    _id: string;
    data: any;
    exp: number;
}

export async function getFromCache<T = any>(name: string, ttl: number, getData: (...args: any[]) => any, ...args: any[]): Promise<T> {
    const cached = await db.findOne<CacheEntry>("cache", { _id: name });

    if (cached && cached.exp > Date.now())
        return cached.data;

    const data = await getData(...args);
    await db.updateOneOrAdd("cache", { _id: name }, { data, exp: Date.now() + ttl });

    return data;
}