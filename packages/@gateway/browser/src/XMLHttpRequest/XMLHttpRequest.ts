/**
 * PURPOSE: Curated entry for the browser XMLHttpRequest surface. Exposes one POST with upload
 * progress and nothing raw — `fetch` reports no bytes-sent signal, so a large request body needs
 * this. Reach for `#gateway/browser/fetch` for every request that needs no progress.
 *
 * USAGE:
 * import { xhrPostWithProgress } from '#gateway/browser/XMLHttpRequest';
 */

export { xhrPostWithProgress } from './xhr-post-with-progress/xhr-post-with-progress';
