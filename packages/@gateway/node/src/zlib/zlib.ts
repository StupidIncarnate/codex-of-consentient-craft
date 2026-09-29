/**
 * PURPOSE: Pass-through for the Node built-in 'zlib'. Code outside the gateway imports zlib
 * through here instead of the raw module, so a future guard or override on zlib lands in this
 * one file and reaches every caller. Lists its members by name beside `default`, the shape
 * `path.ts` uses: `import mod = require('zlib'); export = mod;` is TS1202/TS1203 under a
 * consumer's `module: ESNext` program, which reaches this file's SOURCE directly.
 *
 * USAGE:
 * import { gzipSync, gunzipSync } from '#gateway/node/zlib';
 * import zlib from '#gateway/node/zlib'; // zlib.test.ts pins this to the same object
 * // identity as `import pkgModule from 'zlib'`, which every `registerMock({ fn: gzipSync })` relies on.
 */

export { default } from 'zlib';
export {
  brotliCompress,
  brotliCompressSync,
  brotliDecompress,
  brotliDecompressSync,
  constants,
  createBrotliCompress,
  createBrotliDecompress,
  createDeflate,
  createGunzip,
  createGzip,
  createInflate,
  crc32,
  deflate,
  deflateSync,
  gunzip,
  gunzipSync,
  gzip,
  gzipSync,
  inflate,
  inflateSync,
} from 'zlib';
