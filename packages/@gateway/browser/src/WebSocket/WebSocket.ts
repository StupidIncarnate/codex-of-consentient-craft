/**
 * PURPOSE: Curated entry for the browser global `WebSocket`. Wires `onerror` in addition to
 * `onopen`/`onmessage`/`onclose`, and nothing raw is exported.
 *
 * USAGE:
 * import { connect } from '#gateway/browser/WebSocket';
 */

export { connect } from './connect/connect';
