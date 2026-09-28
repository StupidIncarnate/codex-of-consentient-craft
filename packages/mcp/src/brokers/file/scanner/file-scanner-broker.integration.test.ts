import { fileScannerBroker } from './file-scanner-broker';
import { resolvePackageRoot } from '#gateway/node/module';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { GlobPatternStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('fileScannerBroker (integration: real shared package resolution)', () => {
  it('VALID: {specifier @dungeonmaster/shared/contracts} => resolves the real shared package root directory', () => {
    const root = resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });

    expect(String(root).endsWith('/shared')).toBe(true);
  });

  it('VALID: {broad glob over an empty project root} => surfaces real files from the resolved shared package as @dungeonmaster/shared paths', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'file-scanner-shared' }),
    });

    const results = await fileScannerBroker({
      glob: GlobPatternStub({ value: '**/content-text-contract.ts' }),
      rootPath: PathSegmentStub({ value: String(testbed.guildPath) }),
    });
    testbed.cleanup();

    const expectedPath =
      '@dungeonmaster/shared/src/contracts/content-text/content-text-contract.ts';

    expect(results.map((file) => file.path).filter((path) => path === expectedPath)).toStrictEqual([
      expectedPath,
    ]);
  });
});
