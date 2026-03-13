import axios, { AxiosInstance } from "axios";

export class Transport {
    private client: AxiosInstance;
    private requests: any[] = [];
    private traces: any[] = [];
    private spans: any[] = [];
    private logs: any[] = [];
    private flushInterval: NodeJS.Timeout;

    constructor(endpoint: string, apiKey: string, private flushIntervalMs = 5000) {
        this.client = axios.create({
            baseURL: endpoint,
            timeout: 10_000,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        });

        this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
        if (this.flushInterval.unref) {
            this.flushInterval.unref();
        }
    }

    sendRequest(data: any) { this.requests.push(data); }
    sendTrace(data: any) { this.traces.push(data); }
    sendSpan(data: any) { this.spans.push(data); }
    sendLog(data: any) { this.logs.push(data); }

    async flush() {
        if (this.requests.length) {
            const reqs = this.requests.splice(0, this.requests.length);
            Promise.all(reqs.map(r => this.client.post('/ingest/request', r).catch((e: any) => console.error("Traceflux transport Request failed: ", e.message))));
        }
        if (this.traces.length) {
            const items = this.traces.splice(0, this.traces.length);
            Promise.all(items.map(i => this.client.post('/ingest/trace', i).catch((e: any) => console.error("Traceflux transport Trace failed: ", e.message))));
        }
        if (this.spans.length) {
            const items = this.spans.splice(0, this.spans.length);
            Promise.all(items.map(i => this.client.post('/ingest/span', i).catch((e: any) => console.error("Traceflux transport Span failed: ", e.message))));
        }
        if (this.logs.length) {
            const items = this.logs.splice(0, this.logs.length);
            Promise.all(items.map(i => this.client.post('/ingest/log', i).catch((e: any) => console.error("Traceflux transport Log failed: ", e.message))));
        }
    }

    async shutdown() {
        clearInterval(this.flushInterval);
        await this.flush();
    }
}
