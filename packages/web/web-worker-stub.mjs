/**
 * Build-time stub for the optional `web-worker` npm package. elkjs's Node entry
 * (lib/main.js) does a guarded `require('web-worker')` that only matters when ELK is
 * constructed with a `workerUrl`. The elk layout adapter runs elk on the main thread
 * (no workerUrl), so this stub is never instantiated — it exists only so the browser
 * bundle resolves the `web-worker` specifier inline. Aliasing to it (instead of marking
 * `web-worker` external) keeps a bare `import "web-worker"` — which the browser cannot
 * resolve at runtime — out of the production bundle.
 */
export default class WebWorkerStub {}
