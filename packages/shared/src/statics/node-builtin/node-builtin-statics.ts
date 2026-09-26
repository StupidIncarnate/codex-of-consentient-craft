/**
 * PURPOSE: Lists Node.js built-in module names, bare (no `node:` prefix). The single source
 * gatewayPathFromImportSourceTransformer reads to decide whether a raw import specifier maps to
 * the `node` gateway package or the `npm` one — a name in this list is a Node module the gateway
 * wraps under `@<scope>/node/<name>`; anything else is a third-party package under
 * `@<scope>/npm/<name>`.
 *
 * USAGE:
 * nodeBuiltinStatics.modules.includes('fs');
 * // Returns true - 'fs' is a Node built-in
 */
export const nodeBuiltinStatics = {
  modules: [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'http2',
    'https',
    'module',
    'net',
    'os',
    'path',
    'perf_hooks',
    'process',
    'querystring',
    'readline',
    'repl',
    'stream',
    'string_decoder',
    'timers',
    'tls',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'worker_threads',
    'zlib',
  ],
} as const;
