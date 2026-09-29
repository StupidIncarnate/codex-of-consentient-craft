/**
 * PURPOSE: Pass-through for the Node built-in 'stream'. Code outside the gateway imports stream
 * through here instead of the raw module, so a future guard or override on stream lands in this
 * one file and reaches every caller. Lists its members by name beside `default`, the shape
 * `path.ts` uses: `import mod = require('stream'); export = mod;` is TS1202/TS1203 under a
 * consumer's `module: ESNext` program, which reaches this file's SOURCE directly.
 *
 * USAGE:
 * import { Readable, pipeline } from '#gateway/node/stream';
 * import stream from '#gateway/node/stream'; // stream.test.ts pins this to the same object
 * // identity as `import pkgModule from 'stream'`, which every `registerMock({ fn: pipeline })` relies on.
 */

export { default } from 'stream';
export {
  addAbortSignal,
  Duplex,
  finished,
  PassThrough,
  pipeline,
  promises,
  Readable,
  Stream,
  Transform,
  Writable,
} from 'stream';
