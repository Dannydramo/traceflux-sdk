import { Transport } from './transport';
import { generateTraceId, generateSpanId } from './traceId';
import { setupHttpInterceptors } from './interceptors/http';
import { setupFetchInterceptor } from './interceptors/fetch';

interface InitOptions {
    apiKey: string;
    service: string;
    endpoint?: string;
}

export class Traceflux {
    private static transport: Transport | null = null;
    public static serviceName: string = '';

    static init(options: InitOptions) {
        this.serviceName = options.service;
        // Ingestion API defaults to 4001 or standard 3000 depending on env, user must supply if diff
        const endpoint = options.endpoint || process.env.TRACEFLUX_URL || 'http://localhost:3000';
        this.transport = new Transport(endpoint, options.apiKey);

        this.setupErrorTracking();
        this.setupLogCapture();

        // Instrument outbound dependencies
        setupHttpInterceptors();
        setupFetchInterceptor();
    }

    static getTransport() { return this.transport; }

    static startSpan(name: string, traceId?: string, parentId?: string) {
        const spanId = generateSpanId();
        const tid = traceId || generateTraceId();
        const startTime = new Date();

        if (!traceId && this.transport) {
            this.transport.sendTrace({
                traceId: tid,
                serviceName: this.serviceName,
                timestamp: startTime.toISOString()
            });
        }

        return {
            traceId: tid,
            spanId,
            end: (statusCode?: number) => {
                const endTime = new Date();
                const duration = endTime.getTime() - startTime.getTime();
                if (this.transport) {
                    this.transport.sendSpan({
                        traceId: tid,
                        name,
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        duration,
                        parentId,
                        statusCode // Custom addition to track dependency status
                    } as any);
                }
            }
        };
    }

    private static setupErrorTracking() {
        process.on('uncaughtException', (err) => {
            this.captureError(err);
        });
        process.on('unhandledRejection', (reason) => {
            this.captureError(reason instanceof Error ? reason : new Error(String(reason)));
        });
    }

    private static captureError(err: Error) {
        if (!this.transport) return;
        this.transport.sendLog({
            serviceName: this.serviceName,
            level: 'error',
            message: err.stack || err.message,
            timestamp: new Date().toISOString()
        });
    }

    private static setupLogCapture() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog(...args);
            this.sendLog('info', args);
        };
        console.error = (...args) => {
            originalError(...args);
            this.sendLog('error', args);
        };
        console.warn = (...args) => {
            originalWarn(...args);
            this.sendLog('warn', args);
        };
    }

    private static sendLog(level: string, args: any[]) {
        if (!this.transport) return;
        const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        this.transport.sendLog({
            serviceName: this.serviceName,
            level,
            message,
            timestamp: new Date().toISOString()
        });
    }
}
