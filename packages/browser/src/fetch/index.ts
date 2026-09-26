/**
 * PURPOSE: Curated entry for the browser fetch surface. Exposes a throw-on-anything-unready
 * JSON request, a never-throws-on-4xx/5xx status+body probe, and nothing raw. Reach for this over
 * `@dungeonmaster/node/fetch` inside browser code — the two differ on relative-URL resolution,
 * timeout and non-2xx error richness (see the header on `fetch-json.ts`).
 *
 * USAGE:
 * import { fetchJson, fetchWithStatus } from '@dungeonmaster/browser/fetch';
 */

export { fetchJson } from './fetch-json';
export { fetchWithStatus } from './fetch-with-status';
