/**
 * PURPOSE: Curated entry for the Node fetch surface. Exposes a throw-on-anything-unready JSON
 * request and a never-throws-for-still-booting readiness probe, and nothing raw.
 *
 * USAGE:
 * import { fetchJson, fetchOk } from '@dungeonmaster/node/fetch';
 */

export { fetchJson } from './fetch-json';
export { fetchOk } from './fetch-ok';
