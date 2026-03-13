import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { generateTraceId } from '../../core/traceId';
import { Traceflux } from '../../core/traceflux';
import { safeStringify } from '../../core/utils';

export const fastifyTraceflux = fp(async (fastify: FastifyInstance) => {
    fastify.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
        (req as any).traceId = generateTraceId();
        (req as any).startTime = process.hrtime();
    });

    fastify.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
        const traceId = (req as any).traceId;
        const startTime = (req as any).startTime;

        if (!traceId || !startTime) return;

        reply.header('x-traceflux-trace-id', traceId);

        const diff = process.hrtime(startTime);
        const latency = diff[0] * 1000 + diff[1] / 1e6;

        const reqBody = safeStringify(req.body);
        const reqHeaders = safeStringify(req.headers);

        const transport = Traceflux.getTransport();
        if (transport) {
            transport.sendRequest({
                serviceName: Traceflux.serviceName,
                traceId,
                method: req.method,
                path: req.routeOptions?.url || req.url.split('?')[0],
                status: reply.statusCode,
                latencyMs: latency,
                requestBody: reqBody,
                requestHeaders: reqHeaders,
                timestamp: new Date().toISOString(),
            });
        }
    });
});
