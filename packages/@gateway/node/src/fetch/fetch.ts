/**
 * PURPOSE: Curated entry for the Node fetch surface. Exposes a throw-on-anything-unready JSON
 * request, a never-throws-for-still-booting readiness probe, a never-throws-on-4xx/5xx
 * status+body probe, and the raw `fetch` for a caller that needs the `Response` itself (headers,
 * a streamed body). Prefer `fetchWithStatus` unless the raw response is the point.
 *
 * USAGE:
 * import { fetch, fetchJson, fetchOk, fetchWithStatus } from '#gateway/node/fetch';
 */

export { fetch } from './fetch/fetch';
export { fetchJson } from './fetch-json/fetch-json';
export { fetchOk } from './fetch-ok/fetch-ok';
export { fetchWithStatus } from './fetch-with-status/fetch-with-status';
