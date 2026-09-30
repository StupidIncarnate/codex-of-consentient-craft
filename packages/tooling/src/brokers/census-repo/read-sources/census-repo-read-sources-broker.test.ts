import { censusRepoReadSourcesBroker } from './census-repo-read-sources-broker';
import { censusRepoReadSourcesBrokerProxy } from './census-repo-read-sources-broker.proxy';

describe('censusRepoReadSourcesBroker', () => {
  const repoRoot = '/repo';

  it('VALID: {two matched files, out of order} => entries sorted by path with their text', async () => {
    const proxy = censusRepoReadSourcesBrokerProxy();
    proxy.setupSources({
      repoRoot,
      files: [
        { path: '/repo/packages/b/src/y.ts', contents: 'export const y = 2;' },
        { path: '/repo/packages/a/src/x.ts', contents: 'export const x = 1;' },
      ],
    });

    const result = await censusRepoReadSourcesBroker({ repoRoot });

    expect(result).toStrictEqual([
      { file: 'packages/a/src/x.ts', text: 'export const x = 1;' },
      { file: 'packages/b/src/y.ts', text: 'export const y = 2;' },
    ]);
  });

  it('EMPTY: {no matched files} => an empty list', async () => {
    const proxy = censusRepoReadSourcesBrokerProxy();
    proxy.setupSources({ repoRoot, files: [] });

    const result = await censusRepoReadSourcesBroker({ repoRoot });

    expect(result).toStrictEqual([]);
  });
});
