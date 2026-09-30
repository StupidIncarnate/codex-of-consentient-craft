import { fileScannerBroker } from './file-scanner-broker';
import { resolvePackageRoot } from '#gateway/node/module';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';

describe('fileScannerBroker (integration: real shared package resolution)', () => {
  it('VALID: {specifier @dungeonmaster/shared/contracts} => resolves the real shared package root directory', () => {
    const root = resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });

    expect(String(root).endsWith('/shared')).toBe(true);
  });

  it('VALID: {broad glob over an empty project root} => surfaces real files from the resolved shared package as @dungeonmaster/shared paths', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: 'file-scanner-shared',
    });

    const { glob } = DiscoverInputStub({ glob: '**/contracts/quest/quest-contract.ts' });

    const results = await fileScannerBroker({
      glob: glob!,
      rootPath: String(testbed.guildPath),
    });
    testbed.cleanup();

    const expectedPath = '@dungeonmaster/shared/src/contracts/quest/quest-contract.ts';

    expect(results.map((file) => file.path).filter((path) => path === expectedPath)).toStrictEqual([
      expectedPath,
    ]);
  });
});
