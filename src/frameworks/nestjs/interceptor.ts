import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { generateTraceId } from '../../core/traceId';
import { Traceflux } from '../../core/traceflux';
import { safeStringify } from '../../core/utils';

@Injectable()
export class TracefluxInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const httpCtx = context.switchToHttp();
        const req = httpCtx.getRequest();
        const res = httpCtx.getResponse();

        const traceId = generateTraceId();
        req.traceId = traceId;
        res.setHeader('x-traceflux-trace-id', traceId);

        const startTime = process.hrtime();

        const reqBody = safeStringify(req.body);
        const reqHeaders = safeStringify(req.headers);

        return next.handle().pipe(
            tap({
                next: () => this.record(req, res, traceId, startTime, reqBody, reqHeaders),
                error: (err) => {
                    this.record(req, res, traceId, startTime, reqBody, reqHeaders, err);
                }
            })
        );
    }

    private record(req: any, res: any, traceId: string, startTime: [number, number], reqBody?: string, reqHeaders?: string, err?: any) {
        const diff = process.hrtime(startTime);
        const latency = diff[0] * 1000 + diff[1] / 1e6;
        const routePath = req.route ? req.route.path : (req.path || req.url?.split('?')[0] || '/');

        const transport = Traceflux.getTransport();
        if (transport) {
            transport.sendRequest({
                serviceName: Traceflux.serviceName,
                traceId,
                method: req.method,
                path: routePath,
                status: err ? (err.status || 500) : res.statusCode,
                latencyMs: latency,
                requestBody: reqBody,
                requestHeaders: reqHeaders,
                errorStack: err ? (err.stack || err.message) : undefined,
                timestamp: new Date().toISOString(),
            });
            if (err) {
                transport.sendLog({
                    serviceName: Traceflux.serviceName,
                    level: 'error',
                    message: err.stack || err.message,
                    traceId,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
}
