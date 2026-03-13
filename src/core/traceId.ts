/**
 * @traceflux/node — Trace ID Generator
 *
 * Produces unique identifiers for request correlation. Uses Node's built-in
 * `crypto.randomUUID()` (available since Node 14.17 / 19.0) so that no
 * external dependencies are required.
 */

import { randomUUID } from "crypto";

/**
 * Generate a globally-unique trace identifier.
 *
 * The returned string is a standard v4 UUID (36 chars with hyphens).
 * It is used to correlate a single request across logs, headers, and
 * the Traceflux backend.
 *
 * @returns A new UUID string, e.g. `"8f92a1d9-b8f4-4a3e-9c1b-2d3e4f5a6b7c"`
 */
export function generateTraceId(): string {
    return randomUUID();
}

export function generateSpanId(): string {
    return randomUUID();
}
