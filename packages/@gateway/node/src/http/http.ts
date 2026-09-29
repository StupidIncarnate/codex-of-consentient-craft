/**
 * PURPOSE: Pass-through for the Node built-in 'http'. Code outside the gateway imports http
 * through here instead of the raw module, so a future guard or override on http lands in this
 * one file and reaches every caller. Lists its members by name beside `default`, the shape
 * `path.ts` uses: `import mod = require('http'); export = mod;` is TS1202/TS1203 under a
 * consumer's `module: ESNext` program, which reaches this file's SOURCE directly.
 *
 * USAGE:
 * import { createServer, STATUS_CODES } from '#gateway/node/http';
 * import http from '#gateway/node/http'; // http.test.ts pins this to the same object
 * // identity as `import pkgModule from 'http'`, which every `registerMock({ fn: createServer })` relies on.
 */

export { default } from 'http';
export {
  Agent,
  ClientRequest,
  createServer,
  get,
  globalAgent,
  IncomingMessage,
  maxHeaderSize,
  METHODS,
  OutgoingMessage,
  request,
  Server,
  ServerResponse,
  STATUS_CODES,
  validateHeaderName,
  validateHeaderValue,
} from 'http';
