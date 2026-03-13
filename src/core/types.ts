/**
 * @traceflux/node — Shared type definitions
 *
 * Central type declarations for the Traceflux SDK, including configuration,
 * trace payloads, route info, and Express augmentation.
 */

import type { Request } from "express";

// ---------------------------------------------------------------------------
// SDK Configuration
// ---------------------------------------------------------------------------

/** Configuration options passed to `traceflux.init()`. */
export interface TracefluxConfig {
    /** API key used to authenticate with the Traceflux backend. */
    apiKey: string;

    /** Logical name of the service being traced (e.g. "orders-api"). */
    serviceName: string;

    /** Base URL of the Traceflux ingest endpoint (e.g. "https://api.traceflux.dev"). */
    endpoint: string;

    /**
     * How often (in ms) the trace buffer is flushed to the backend.
     * @default 5000
     */
    flushIntervalMs?: number;

    /**
     * Number of traces that trigger an immediate flush.
     * @default 50
     */
    maxBufferSize?: number;

    /**
     * Hard cap on buffered traces. Traces arriving when the buffer is full
     * are silently dropped to prevent memory pressure.
     * @default 500
     */
    maxQueueSize?: number;
    /**
     * Optional Project ID
     */
    projectId?: string;
}

// ---------------------------------------------------------------------------
// Trace Payload
// ---------------------------------------------------------------------------

/** A single request trace sent to the Traceflux backend. */
export interface TracePayload {
    /** Unique identifier for this request trace. */
    traceId: string;

    /** HTTP method (GET, POST, PUT, DELETE, etc.). */
    method: string;

    /** Matched Express route path (e.g. "/users/:id"). */
    endpoint: string;

    /** Original request URL. */
    url: string;

    /** HTTP response status code. */
    status: number;

    /** Request latency in milliseconds. */
    latencyMs: number;

    /** ISO-8601 timestamp of when the request was received. */
    timestamp: string;

    /** Name of the service that handled this request. */
    serviceName?: string;

}

// ---------------------------------------------------------------------------
// Route Information
// ---------------------------------------------------------------------------

/** Describes a single Express route registered in the application. */
export interface RouteInfo {
    /** HTTP method in uppercase (e.g. "GET"). */
    method: string;

    /** Route path pattern (e.g. "/users/:id"). */
    path: string;
}

// ---------------------------------------------------------------------------
// Express Augmentation
// ---------------------------------------------------------------------------

/**
 * Augment the Express Request interface so that `req.traceId` is available
 * in downstream middleware and route handlers without type errors.
 */
declare global {
    namespace Express {
        interface Request {
            traceId?: string;
        }
    }
}
