import { censusRepoReadSourcesChunkLayerBroker } from './census-repo-read-sources-chunk-layer-broker';
import { censusRepoReadSourcesChunkLayerBrokerProxy } from './census-repo-read-sources-chunk-layer-broker.proxy';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';

describe('censusRepoReadSourcesChunkLayerBroker', () => {
  const repoRoot = '/repo';

  it('VALID: {two files} => entries keyed by repo-relative path, in order', async () => {
    const proxy = censusRepoReadSourcesChunkLayerBrokerProxy();
    proxy.setupFile({ path: '/repo/packages/a/src/x.ts', contents: 'export const x = 1;' });
    proxy.setupFile({ path: '/repo/packages/a/src/y.ts', contents: 'export const y = 2;' });

    const result = await censusRepoReadSourcesChunkLayerBroker({
      repoRoot,
      files: ['/repo/packages/a/src/x.ts', '/repo/packages/a/src/y.ts'],
    });

    expect(result).toStrictEqual([
      { file: 'packages/a/src/x.ts', text: 'export const x = 1;' },
      { file: 'packages/a/src/y.ts', text: 'export const y = 2;' },
    ]);
  });

  it('EDGE: {more files than one chunk} => every file is read, in order, across chunks', async () => {
    const proxy = censusRepoReadSourcesChunkLayerBrokerProxy();
    const count = censusLayoutStatics.readChunkSize + 3;
    const files = Array.from(
      { length: count },
      (_unused, index) => `/repo/packages/a/src/f${index}.ts`,
    );
    for (const path of files) {
      proxy.setupFile({ path, contents: `// ${path}` });
    }

    const result = await censusRepoReadSourcesChunkLayerBroker({ repoRoot, files });

    expect(result.map((entry) => entry.file)).toStrictEqual(
      files.map((path) => path.slice('/repo/'.length)),
    );
  });

  it('EDGE: {a file that vanished} => skipped, the others still read', async () => {
    const proxy = censusRepoReadSourcesChunkLayerBrokerProxy();
    proxy.setupMissingFile({ path: '/repo/packages/a/src/gone.ts' });
    proxy.setupFile({ path: '/repo/packages/a/src/x.ts', contents: 'export const x = 1;' });

    const result = await censusRepoReadSourcesChunkLayerBroker({
      repoRoot,
      files: ['/repo/packages/a/src/gone.ts', '/repo/packages/a/src/x.ts'],
    });

    expect(result).toStrictEqual([{ file: 'packages/a/src/x.ts', text: 'export const x = 1;' }]);
  });

  it('EMPTY: {no files} => an empty list', async () => {
    censusRepoReadSourcesChunkLayerBrokerProxy();

    const result = await censusRepoReadSourcesChunkLayerBroker({ repoRoot, files: [] });

    expect(result).toStrictEqual([]);
  });
});
