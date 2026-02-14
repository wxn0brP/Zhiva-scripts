import { db } from "./db";

export interface CacheEntry {
    _id: string;
    data: any;
    exp: number;
}

export async function getFromCache<T extends (...args: any) => any>(
    name: string,
    ttl: number,
    getData: T,
    args: Parameters<T> = [] as any
): Promise<ReturnType<T>> {
    const cached = await db.cache.findOne({ _id: name });

    if (cached && cached.exp > Date.now())
        return cached.data;

    const data = await getData(...args);
    await db.cache.updateOneOrAdd({ _id: name }, { data, exp: Date.now() + ttl });

    return data;
}
