/**
 * PURPOSE: Curated entry for the browser global `Date`'s clock reads. Each wrapper reads
 * `Date.now()` at call time, so `nowProxy` and `nowIsoProxy` stage one clock for both. Parsing a
 * known timestamp (`new Date(iso)`, `Date.parse`) reads no clock and needs no wrapper.
 *
 * USAGE:
 * import { now, nowIso } from '#gateway/browser/Date';
 */

export { now } from './now/now';
export { nowIso } from './now-iso/now-iso';
