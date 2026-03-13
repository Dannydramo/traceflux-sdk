import http = require('http');
import https = require('https');
import { Traceflux } from '../traceflux';

type RequestModule = any;

export function setupHttpInterceptors() {
    patchModule('http', http);
    patchModule('https', https);
}

function patchModule(moduleName: string, configModule: RequestModule) {
    const originalRequest = configModule.request;
    const originalGet = configModule.get;

    function wrapRequest(original: any) {
        return function (this: any, ...args: any[]) {
            const req = original.apply(this, args);

            let url = '';
            let method = 'GET';

            // Extract URL and Method from args
            const arg0 = args[0];
            if (typeof arg0 === 'string' || arg0 instanceof URL) {
                url = arg0.toString();
                method = (args[1] && (args[1] as any).method) ? (args[1] as any).method.toUpperCase() : 'GET';
            } else if (typeof arg0 === 'object') {
                const protocol = arg0.protocol || (moduleName + ':');
                const host = arg0.hostname || arg0.host || 'localhost';
                const port = arg0.port ? (':' + arg0.port) : '';
                const path = arg0.path || '/';
                url = `${protocol}//${host}${port}${path}`;
                method = (arg0.method) ? arg0.method.toUpperCase() : 'GET';
            }

            try {
                // Ensure we have a valid absolute URL for parsing
                const fullUrl = url.includes('://') ? url : `${moduleName}://${url}`;
                const parsedUrl = new URL(fullUrl);

                // Create span for this outbound call
                const spanName = `HTTP ${method} ${parsedUrl.hostname}`;
                const span = Traceflux.startSpan(spanName);

                // Inject trace ID into headers
                if (req.setHeader) {
                    req.setHeader('x-traceflux-trace-id', span.traceId);
                }

                req.on('response', (res: any) => {
                    res.on('end', () => {
                        span.end(res.statusCode);
                    });
                });

                req.on('error', () => {
                    span.end(500);
                });
            } catch (err) {
                // Fail silently for tracing but don't crash the app
            }

            return req;
        };
    }

    configModule.request = wrapRequest(originalRequest);
    configModule.get = wrapRequest(originalGet);
}
