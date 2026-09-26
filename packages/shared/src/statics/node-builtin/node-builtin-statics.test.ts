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

  it.each(['fs', 'child_process', 'net', 'readline', 'path'])(
    'VALID: {module: "%s"} => modules includes it',
    (moduleName) => {
      const found = nodeBuiltinStatics.modules.find((mod) => mod === moduleName);

      expect(found).toBe(moduleName);
    },
  );

  it('INVALID: {module: "zod"} => modules does not include a third-party package name', () => {
    const [thirdPartyPackageName] = ['zod'];
    const found = nodeBuiltinStatics.modules.find((mod) => mod === thirdPartyPackageName);

    expect(found).toBe(undefined);
  });
});
