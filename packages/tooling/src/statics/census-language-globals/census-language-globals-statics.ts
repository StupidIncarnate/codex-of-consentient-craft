/**
 * PURPOSE: The JavaScript built-ins an adapter may call without that being a call into the outside
 * world. The census skips them, so `JSON.parse` or `new Map()` never counts as the adapter's one
 * outside call. Node and browser globals (`setTimeout`, `process`, `fetch`) are absent on purpose:
 * those are what a gateway wraps.
 *
 * USAGE:
 * censusLanguageGlobalsStatics.names.includes('JSON');
 * // Returns true
 */
export const censusLanguageGlobalsStatics = {
  names: [
    'JSON',
    'Math',
    'Object',
    'Array',
    'Promise',
    'Number',
    'String',
    'Boolean',
    'Date',
    'Error',
    'TypeError',
    'RangeError',
    'Symbol',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'Reflect',
    'RegExp',
    'BigInt',
    'Intl',
    'Uint8Array',
    'ArrayBuffer',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURIComponent',
    'decodeURIComponent',
    'structuredClone',
  ],
} as const;
