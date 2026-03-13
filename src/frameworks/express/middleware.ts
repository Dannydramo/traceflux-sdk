import { Request, Response, NextFunction } from 'express';
import { generateTraceId } from '../../core/traceId';
import { Traceflux } from '../../core/traceflux';
import { safeStringify } from '../../core/utils';

/**
 * Express middleware to trace requests
 */
export const expressMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const traceId = generateTraceId();
        (req as any).traceId = traceId;
        res.setHeader('x-traceflux-trace-id', traceId);

        const startTime = process.hrtime();

        // Capture payload before stream ends
        const reqBody = safeStringify(req.body);
        const reqHeaders = safeStringify(req.headers);

        res.on('finish', () => {
            const diff = process.hrtime(startTime);
            const latency = diff[0] * 1000 + diff[1] / 1e6; // ms

            const routePath = req.route ? req.route.path : (req.path || req.originalUrl?.split('?')[0] || req.url?.split('?')[0] || '/');

            const transport = Traceflux.getTransport();
            if (transport) {
                transport.sendRequest({
                    serviceName: Traceflux.serviceName,
                    traceId,
                    method: req.method,
                    path: routePath,
                    status: res.statusCode,
                    latencyMs: latency,
                    requestBody: reqBody,
                    requestHeaders: reqHeaders,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        next();
    };
};
