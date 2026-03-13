import { Traceflux } from '../traceflux';

export function setupFetchInterceptor() {
    if (typeof globalThis.fetch !== 'function') {
        return; // Fetch API is not available
    }

    const originalFetch = globalThis.fetch;

    globalThis.fetch = async function (...args: any[]) {
        let url = '';
        let method = 'GET';

        const reqArg = args[0];
        if (typeof reqArg === 'string' || reqArg instanceof URL) {
            url = reqArg.toString();
        } else if (reqArg && typeof reqArg === 'object' && reqArg.url) {
            url = reqArg.url;
            method = reqArg.method || 'GET';
        }

        const options = args[1] || {};
        method = (options.method || method).toUpperCase();

        const hostname = new URL(url).hostname || url;
        const spanName = `FETCH ${method} ${hostname}`;
        const span = Traceflux.startSpan(spanName);

        // Inject Trace Id Header
        const headers = new Headers(options.headers || reqArg?.headers || {});
        headers.set('x-traceflux-trace-id', span.traceId);

        if (reqArg instanceof Request) {
            // Reconstruct request if it's a request object since headers are read-only
            args[0] = new Request(reqArg, { headers });
            if (args[1]) {
                args[1].headers = headers;
            }
        } else {
            options.headers = headers;
            args[1] = options;
        }

        try {
            const response = await originalFetch.apply(this, args as any);
            span.end(response.status);
            return response;
        } catch (error) {
            span.end(500);
            throw error;
        }
    };
}
