export function safeStringify(obj: any): string | undefined {
    if (!obj) return undefined;
    if (typeof obj === 'string') return obj;
    try {
        // Prevent massive payloads from crashing the serialization or taking too much memory
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'string' && value.length > 5000) {
                return value.substring(0, 5000) + '...[truncated]';
            }
            return value;
        });
    } catch (e) {
        return '[Unserializable object]';
    }
}
