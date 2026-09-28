import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { adapterCensusHarness } from '../../../test/harnesses/adapter-census/adapter-census.harness';

describe('AdapterCensusFlow', () => {
  const harness = adapterCensusHarness();

  describe('a fixture workspace built in the OS temp dir', () => {
    it(
      'VALID: {--format=json} => the full census: shapes, gateway match, callers, proxy chain and catch-all sites',
      () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'census-json' }),
        });
        harness.installFixture({ testbed });

        const result = harness.runCensus({ args: [`--cwd=${testbed.guildPath}`, '--format=json'] });
        testbed.cleanup();

        expect({
          exitCode: result.exitCode,
          stderr: result.stderr,
          census: JSON.parse(result.stdout),
        }).toStrictEqual({
          exitCode: 0,
          stderr: '',
          census: {
            scope: '@acme',
            packages: [
              {
                name: '@acme/app',
                dir: 'packages/app',
                adapters: [
                  {
                    file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts',
                    exportNames: ['fsReadFileAdapter'],
                    shape: 'pass-through',
                    reasons: [],
                    outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
                    gateway: [
                      {
                        importPath: '#gateway/node/fs__promises',
                        name: 'readFile',
                        match: 'exact',
                      },
                    ],
                    productionCallers: [
                      {
                        file: 'packages/app/src/brokers/x/y/x-y-broker.ts',
                        proxyFile: 'packages/app/src/brokers/x/y/x-y-broker.proxy.ts',
                        composedBy: ['packages/app/src/responders/r/z/r-z-responder.proxy.ts'],
                        catchAll: [
                          {
                            file: 'packages/app/src/responders/r/z/r-z-responder.proxy.ts',
                            sites: [
                              {
                                line: 3,
                                kind: 'accept-all-predicate',
                                snippet: 'handle.onceFor([() => true])',
                              },
                            ],
                          },
                        ],
                      },
                    ],
                    testFiles: [
                      'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.test.ts',
                    ],
                    proxyFiles: [],
                    adapterProxy: {
                      file: 'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
                      catchAll: [
                        {
                          line: 3,
                          kind: 'empty-address',
                          snippet: 'registerMock({ fn: run }).calledWith([])',
                        },
                      ],
                      composedBy: ['packages/app/src/brokers/x/y/x-y-broker.proxy.ts'],
                    },
                  },
                ],
              },
              {
                name: '@acme/lib',
                dir: 'packages/lib',
                adapters: [
                  {
                    file: 'packages/lib/src/adapters/net/check/net-check-adapter.ts',
                    exportNames: ['netCheckAdapter'],
                    shape: 'logic',
                    reasons: ['no-gateway-export', 'try-catch'],
                    outsideCalls: [{ module: 'net', name: 'createServer' }],
                    gateway: [],
                    productionCallers: [
                      {
                        file: 'packages/app/src/brokers/z/w/z-w-broker.ts',
                        proxyFile: null,
                        composedBy: [],
                        catchAll: [],
                      },
                    ],
                    testFiles: [],
                    proxyFiles: [],
                    adapterProxy: null,
                  },
                ],
              },
            ],
            totals: {
              adapters: 2,
              passThrough: 1,
              logic: 1,
              productionCallers: 2,
              composingProxies: 1,
              catchAllProxies: 1,
            },
          },
        });
      },
      harness.timeoutMs,
    );

    it(
      'VALID: {no --format} => the table with both packages and the totals line',
      () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'census-table' }),
        });
        harness.installFixture({ testbed });

        const result = harness.runCensus({ args: [`--cwd=${testbed.guildPath}`] });
        testbed.cleanup();

        expect({ exitCode: result.exitCode, stdout: result.stdout }).toStrictEqual({
          exitCode: 0,
          stdout: [
            'Adapter census (scope @acme)',
            '',
            'packages/app (@acme/app): 1 adapters',
            '  adapter                               shape         gateway           prod  test  proxies  catch-all  why',
            '  fs/read-file/fs-read-file-adapter.ts  pass-through  readFile (exact)  1     1     1        1',
            '',
            'packages/lib (@acme/lib): 1 adapters',
            '  adapter                         shape  gateway  prod  test  proxies  catch-all  why',
            '  net/check/net-check-adapter.ts  logic  -        1     0     0        0          no-gateway-export,try-catch',
            '',
            'Totals: 2 adapters, 1 pass-through, 1 logic; 2 production callers; 1 composing proxies, 1 of them staging a catch-all.',
            '',
          ].join('\n'),
        });
      },
      harness.timeoutMs,
    );

    it(
      'VALID: {--package=lib} => only the lib package, with its caller in app, and totals over what is reported',
      () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'census-filter' }),
        });
        harness.installFixture({ testbed });

        const result = harness.runCensus({
          args: [`--cwd=${testbed.guildPath}`, '--format=json', '--package=lib'],
        });
        testbed.cleanup();

        expect(JSON.parse(result.stdout)).toStrictEqual({
          scope: '@acme',
          packages: [
            {
              name: '@acme/lib',
              dir: 'packages/lib',
              adapters: [
                {
                  file: 'packages/lib/src/adapters/net/check/net-check-adapter.ts',
                  exportNames: ['netCheckAdapter'],
                  shape: 'logic',
                  reasons: ['no-gateway-export', 'try-catch'],
                  outsideCalls: [{ module: 'net', name: 'createServer' }],
                  gateway: [],
                  productionCallers: [
                    {
                      file: 'packages/app/src/brokers/z/w/z-w-broker.ts',
                      proxyFile: null,
                      composedBy: [],
                      catchAll: [],
                    },
                  ],
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
            productionCallers: 1,
            composingProxies: 0,
            catchAllProxies: 0,
          },
        });
      },
      harness.timeoutMs,
    );
  });

  describe('a directory that is not a workspace', () => {
    it(
      'ERROR: {--cwd with no package.json} => exit code 1 and the path in the error',
      () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'census-empty' }),
        });
        testbed.cleanup();

        const result = harness.runCensus({ args: [`--cwd=${testbed.guildPath}`] });

        expect({
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        }).toStrictEqual({
          exitCode: 1,
          stdout: '',
          stderr: `Error: adapter-census: cannot read ${testbed.guildPath}/package.json: Error: ENOENT: no such file or directory, open '${testbed.guildPath}/package.json'\n`,
        });
      },
      harness.timeoutMs,
    );
  });

  describe('this repository, read-only', () => {
    it(
      'VALID: {--cwd=<this checkout>} => every adapter is counted once and every count adds up',
      () => {
        const result = harness.runCensus({ args: [`--cwd=${harness.repoRoot}`] });
        const counts = harness.readCounts({ stdout: result.stdout });

        expect({
          exitCode: result.exitCode,
          shapesAddUp: counts.adapters === counts.passThrough + counts.logic,
          packagesAddUp: counts.adapters === counts.perPackageSum,
          foundAdapters: counts.adapters > 0,
        }).toStrictEqual({
          exitCode: 0,
          shapesAddUp: true,
          packagesAddUp: true,
          foundAdapters: true,
        });
      },
      harness.timeoutMs,
    );
  });
});
