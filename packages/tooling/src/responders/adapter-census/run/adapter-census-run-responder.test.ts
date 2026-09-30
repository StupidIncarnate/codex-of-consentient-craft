import { AdapterCensusRunResponder } from './adapter-census-run-responder';
import { AdapterCensusRunResponderProxy } from './adapter-census-run-responder.proxy';

describe('AdapterCensusRunResponder', () => {
  describe('table output', () => {
    it('VALID: {no args} => the table for the current directory, with the default format', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      proxy.setupSharedStemRepo({});

      await AdapterCensusRunResponder({ args: [] });

      expect(proxy.getStdoutOutput().join('')).toBe(
        [
          'Adapter census (scope @acme)',
          '',
          'packages/app (@acme/app): 1 adapters',
          '  adapter                   shape  gateway  prod  test  proxies  catch-all  why',
          '  os/tmp/os-tmp-adapter.ts  logic  -        1     0     0        0          no-gateway-export',
          '',
          'packages/lib (@acme/lib): 1 adapters',
          '  adapter                   shape  gateway  prod  test  proxies  catch-all  why',
          '  os/tmp/os-tmp-adapter.ts  logic  -        0     0     0        0          no-gateway-export',
          '',
          'Totals: 2 adapters, 0 pass-through, 2 logic; 1 production callers; 0 composing proxies, 0 of them staging a catch-all.',
          '',
        ].join('\n'),
      );
    });

    it('VALID: {--package=lib} => only the lib block', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      proxy.setupSharedStemRepo({});

      await AdapterCensusRunResponder({ args: ['--package=lib'] });

      expect(proxy.getStdoutOutput().join('')).toBe(
        [
          'Adapter census (scope @acme)',
          '',
          'packages/lib (@acme/lib): 1 adapters',
          '  adapter                   shape  gateway  prod  test  proxies  catch-all  why',
          '  os/tmp/os-tmp-adapter.ts  logic  -        0     0     0        0          no-gateway-export',
          '',
          'Totals: 1 adapters, 0 pass-through, 1 logic; 0 production callers; 0 composing proxies, 0 of them staging a catch-all.',
          '',
        ].join('\n'),
      );
    });
  });

  describe('json output', () => {
    it('VALID: {--format=json} => the census document with two-space indentation and a trailing newline', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      proxy.setupSharedStemRepo({});

      await AdapterCensusRunResponder({ args: ['--format=json', '--package=lib'] });

      expect(JSON.parse(proxy.getStdoutOutput().join(''))).toStrictEqual({
        scope: '@acme',
        packages: [
          {
            name: '@acme/lib',
            dir: 'packages/lib',
            adapters: [
              {
                file: 'packages/lib/src/adapters/os/tmp/os-tmp-adapter.ts',
                exportNames: ['osTmpAdapter'],
                shape: 'logic',
                reasons: ['no-gateway-export'],
                outsideCalls: [{ module: 'os', name: 'tmpdir' }],
                gateway: [],
                productionCallers: [],
                testFiles: [],
                proxyFiles: [],
                adapterProxy: null,
              },
            ],
          },
        ],
        totals: {
          adapters: 1,
          passThrough: 0,
          logic: 1,
          productionCallers: 0,
          composingProxies: 0,
          catchAllProxies: 0,
        },
      });
    });

    it('VALID: {--format=json} => the text is indented by two spaces and ends with a newline', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      proxy.setupSharedStemRepo({});

      await AdapterCensusRunResponder({ args: ['--format=json', '--package=lib'] });

      expect(proxy.getStdoutOutput().join('')).toMatch(
        /^\{\n {2}"scope": "@acme",\n[\s\S]*\n\}\n$/u,
      );
    });
  });

  describe('--cwd', () => {
    it('VALID: {--cwd=/other/repo} => scans that directory', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      const repoRoot = '/other/repo';
      proxy.setupSharedStemRepo({ repoRoot });

      await AdapterCensusRunResponder({ args: ['--cwd=/other/repo', '--package=lib'] });

      expect(proxy.getStdoutOutput().join('')).toBe(
        [
          'Adapter census (scope @acme)',
          '',
          'packages/lib (@acme/lib): 1 adapters',
          '  adapter                   shape  gateway  prod  test  proxies  catch-all  why',
          '  os/tmp/os-tmp-adapter.ts  logic  -        0     0     0        0          no-gateway-export',
          '',
          'Totals: 1 adapters, 0 pass-through, 1 logic; 0 production callers; 0 composing proxies, 0 of them staging a catch-all.',
          '',
        ].join('\n'),
      );
    });
  });

  describe('failures', () => {
    it('ERROR: {no package.json in the directory} => rejects naming the path', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      proxy.setupMissingRoot({});

      await expect(AdapterCensusRunResponder({ args: [] })).rejects.toThrow(
        /^adapter-census: cannot read \/census\/default-cwd\/package\.json: .*$/u,
      );
    });

    it('INVALID: {--format=xml} => rejects with an invalid-option error', async () => {
      const proxy = AdapterCensusRunResponderProxy();
      proxy.setupSharedStemRepo({});

      await expect(AdapterCensusRunResponder({ args: ['--format=xml'] })).rejects.toThrow(
        /^[\s\S]*Invalid option[\s\S]*$/u,
      );
    });
  });
});
