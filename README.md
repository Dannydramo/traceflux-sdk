# @traceflux/node

> Traceflux Node.js SDK — API observability for Express.js applications.

Automatically detects routes, traces every request, batches telemetry, and ships it to the Traceflux backend.

---

## Installation

```bash
npm install @traceflux/node
```

## Quick Start

```ts
import express from "express";
import { traceflux } from "@traceflux/node";

// 1. Initialise
traceflux.init({
  apiKey: "TRACEFLUX_API_KEY",
  serviceName: "orders-api",
  endpoint: "https://api.traceflux.dev",
});

// 2. Create app & attach middleware
const app = express();
app.use(traceflux.middleware());

// 3. Define routes as normal
app.get("/users", (req, res) => res.json([]));
app.post("/orders", (req, res) => res.status(201).json({}));

app.listen(3000);
```

## What the SDK Does

| Feature            | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| **Route Detection**    | Walks `app._router.stack` and reports all routes to `POST /v1/routes`.     |
| **Request Tracing**    | Captures method, path, status, latency, and timestamp for every request.   |
| **Trace IDs**          | Generates a UUID per request, attaches it to `req.traceId` and the `x-traceflux-trace-id` response header. |
| **Batch Sending**      | Buffers traces in memory; flushes every 5 s or when 50 traces accumulate.  |
| **Reliability**        | Retries with exponential back-off, drops traces beyond 500 to cap memory.  |

## Configuration

```ts
traceflux.init({
  apiKey: string;          // Required — API key for authentication
  serviceName: string;     // Required — logical service name
  endpoint: string;        // Required — Traceflux ingest base URL

  flushIntervalMs?: number; // Flush interval in ms          (default: 5000)
  maxBufferSize?: number;   // Flush threshold               (default: 50)
  maxQueueSize?: number;    // Hard cap on buffered traces    (default: 500)
});
```

## Trace Payload Shape

```json
{
  "traceId": "8f92a1d9-b8f4-4a3e-9c1b-2d3e4f5a6b7c",
  "method": "POST",
  "path": "/orders",
  "url": "/orders?ref=checkout",
  "status": 201,
  "latency": 110.25,
  "timestamp": "2026-03-08T12:00:00.000Z",
  "serviceName": "orders-api"
}
```

## Graceful Shutdown

```ts
process.on("SIGINT", async () => {
  await traceflux.shutdown(); // flushes remaining traces
  server.close();
});
```

## Project Structure

```
src/
  index.ts            — public entry point & re-exports
  traceflux.ts        — main SDK orchestrator (singleton)
  middleware.ts        — Express request-tracing middleware
  routeExtractor.ts   — walks Express router stack
  transport.ts        — HTTP transport with retry
  buffer.ts           — in-memory trace buffer
  traceId.ts          — UUID generator
  types.ts            — shared TypeScript interfaces
```

## Build

```bash
npm install
npm run build        # compiles to dist/
```

## Run the Example

```bash
npx ts-node example/server.ts
```

## License

MIT
