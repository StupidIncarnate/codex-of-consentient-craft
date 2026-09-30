import { adapterCensusRunBroker } from './adapter-census-run-broker';
import { adapterCensusRunBrokerProxy } from './adapter-census-run-broker.proxy';

describe('adapterCensusRunBroker', () => {
  const repoRoot = '/repo';

  it('VALID: {two packages with the same adapter stem, one caller} => each package lists its own adapter and only app has a caller', async () => {
    const proxy = adapterCensusRunBrokerProxy();
    proxy.setupSharedStemRepo({ repoRoot });

    const result = await adapterCensusRunBroker({ repoRoot });

    expect(
      result.packages.map((pkg) => ({
        name: pkg.name,
        adapters: pkg.adapters.map((adapter) => ({
          file: adapter.file,
          callers: adapter.productionCallers.map((caller) => caller.file),
          shape: adapter.shape,
          reasons: adapter.reasons,
        })),
      })),
    ).toStrictEqual([
      {
        name: '@acme/app',
        adapters: [
          {
            file: 'packages/app/src/adapters/os/tmp/os-tmp-adapter.ts',
            callers: ['packages/app/src/brokers/a/b/a-b-broker.ts'],
            shape: 'logic',
            reasons: ['no-gateway-export'],
          },
        ],
      },
      {
        name: '@acme/lib',
        adapters: [
          {
            file: 'packages/lib/src/adapters/os/tmp/os-tmp-adapter.ts',
            callers: [],
            shape: 'logic',
            reasons: ['no-gateway-export'],
          },
        ],
      },
    ]);
  });

  it('VALID: {packageFilter: "lib"} => only the lib package, totals over what is reported', async () => {
    const proxy = adapterCensusRunBrokerProxy();
    proxy.setupSharedStemRepo({ repoRoot });

    const result = await adapterCensusRunBroker({ repoRoot, packageFilter: 'lib' });

    expect({
      scope: result.scope,
      names: result.packages.map((pkg) => pkg.name),
      totals: result.totals,
    }).toStrictEqual({
      scope: '@acme',
      names: ['@acme/lib'],
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

  it('ERROR: {no root package.json} => rejects naming the path', async () => {
    const proxy = adapterCensusRunBrokerProxy();
    proxy.setupMissingRoot({ repoRoot });

    await expect(adapterCensusRunBroker({ repoRoot })).rejects.toThrow(
      /^adapter-census: cannot read \/repo\/package\.json: .*$/u,
    );
  });
});
