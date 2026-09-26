/**
 * PURPOSE: Curated entry for the Node fetch surface. Exposes a throw-on-anything-unready JSON
 * request, a never-throws-for-still-booting readiness probe, and a never-throws-on-4xx/5xx
 * status+body probe, and nothing raw.
 *
 * USAGE:
 * import { fetchJson, fetchOk, fetchWithStatus } from '@dungeonmaster/node/fetch';
 */

export { fetchJson } from './fetch-json';
export { fetchOk } from './fetch-ok';
export { fetchWithStatus } from './fetch-with-status';
