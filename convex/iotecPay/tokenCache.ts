export class TokenCache {

    private cache: Record<string, { value: string, expiry: number }>;

    constructor() {
        this.cache = {};
    }

    set(key: string, value: string, ttl: number) {
        const now = Date.now();
        const expiry = now + ttl;
        this.cache[key] = { value, expiry };
    }

    get(key: string) {
        const now = Date.now();
        const cachedItem = this.cache[key];

        if (!cachedItem) {
            return null;
        }

        if (now > cachedItem.expiry) {
            delete this.cache[key];
            return null;
        }

        return cachedItem.value;
    }

    delete(key: string) {
        delete this.cache[key];
    }

    clear() {
        this.cache = {};
    }
}
