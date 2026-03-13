/**
 * @traceflux/node — Trace Buffer
 *
 * In-memory buffer that accumulates `TracePayload` objects and flushes them
 * in batches. The buffer enforces two limits:
 *
 * 1. **maxBufferSize** — when reached, the buffer signals a flush (default 50).
 * 2. **maxQueueSize** — hard cap; traces arriving beyond this are silently
 *    dropped to prevent runaway memory usage (default 500).
 */

import { TracePayload } from "./types";

export interface BufferOptions {
    /** Number of traces that trigger an immediate flush. */
    maxBufferSize?: number;

    /** Hard cap — traces are dropped when the buffer exceeds this size. */
    maxQueueSize?: number;
}

export class TraceBuffer {
    private buffer: TracePayload[] = [];
    private readonly maxBufferSize: number;
    private readonly maxQueueSize: number;

    /** Callback invoked when the buffer reaches `maxBufferSize`. */
    public onFlushReady: ((traces: TracePayload[]) => void) | null = null;

    constructor(options: BufferOptions = {}) {
        this.maxBufferSize = options.maxBufferSize ?? 50;
        this.maxQueueSize = options.maxQueueSize ?? 500;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Add a trace to the buffer.
     *
     * If the buffer has reached `maxQueueSize` the trace is silently dropped.
     * If the buffer has reached `maxBufferSize` the `onFlushReady` callback
     * is invoked with all buffered traces and the buffer is drained.
     */
    add(trace: TracePayload): void {
        // Hard cap — protect against memory pressure
        if (this.buffer.length >= this.maxQueueSize) {
            return;
        }

        this.buffer.push(trace);

        // Check flush threshold
        if (this.buffer.length >= this.maxBufferSize && this.onFlushReady) {
            const traces = this.flush();
            this.onFlushReady(traces);
        }
    }

    /**
     * Drain the buffer and return all accumulated traces.
     * After calling this the buffer is empty.
     */
    flush(): TracePayload[] {
        const traces = [...this.buffer];
        this.buffer = [];
        return traces;
    }

    /** Returns the number of traces currently buffered. */
    get size(): number {
        return this.buffer.length;
    }
}
