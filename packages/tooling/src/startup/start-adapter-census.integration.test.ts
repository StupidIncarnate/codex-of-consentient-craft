import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { adapterCensusHarness } from '../../test/harnesses/adapter-census/adapter-census.harness';

describe('StartAdapterCensus', () => {
  const harness = adapterCensusHarness();

  it(
    'VALID: {argv: --cwd, --format=json, --package=lib} => the bin hands process.argv past the node and script names to the flow',
    () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'census-startup' }),
      });
      harness.installFixture({ testbed });

      const result = harness.runCensus({
        args: [`--cwd=${testbed.guildPath}`, '--format=json', '--package=lib'],
      });
      testbed.cleanup();

      expect({ exitCode: result.exitCode, census: JSON.parse(result.stdout) }).toStrictEqual({
        exitCode: 0,
        census: {
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
        },
      });
    },
    harness.timeoutMs,
  );
});
