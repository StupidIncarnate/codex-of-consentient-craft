/**
 * PURPOSE: Lists Node.js built-in module names for import validation
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
