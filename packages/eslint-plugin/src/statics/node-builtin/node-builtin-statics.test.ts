import { nodeBuiltinStatics } from './node-builtin-statics';

describe('nodeBuiltinStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(nodeBuiltinStatics).toStrictEqual({
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
    });
  });
});
