/**
 * PURPOSE: Regression guard for the worktree-blindness bug — asserts against a REAL, unmocked
 * filesystem (via installTestbedCreateBroker) that resolving the project root from a path INSIDE
 * a worktree nested under a main checkout returns the WORKTREE, not the enclosing checkout, and
 * that an inventory taken from the resolved root sees only the worktree's own packages. This
 * exercises cwdResolveBroker (the primitive callerRepoRootResolveBroker delegates to once it has
 * a starting path) and architecturePackageInventoryBroker directly and for real — no proxy, no
 * mocked fs — since an integration test runs real code without mocking, and `startPath` IS the
 * explicit input a real caller's location would supply.
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { architecturePackageInventoryBroker } from '@dungeonmaster/shared/brokers';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

describe('cwdResolveBroker + architecturePackageInventoryBroker (integration: real nested worktree layout)', () => {
  it('VALID: {startPath deep inside a worktree nested under the main checkout} => resolves the WORKTREE root, and an inventory taken there sees the worktree package but NOT a package that exists only in the outer checkout', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'caller-repo-root-nested' }),
    });

    testbed.writeFile({
      relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      content: FileContentStub({ value: '{}' }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'packages/outer-only-pkg/src/index.ts' }),
      content: FileContentStub({ value: 'export const outerOnly = true;' }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'worktrees/siegelense-test/.dungeonmaster.json' }),
      content: FileContentStub({ value: '{}' }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({
        value: 'worktrees/siegelense-test/packages/inner-pkg/src/brokers/foo/foo-broker.ts',
      }),
      content: FileContentStub({ value: 'export const fooBroker = () => true;' }),
    });

    const innerRoot = `${String(testbed.guildPath)}/worktrees/siegelense-test`;
    const deepStartPath = `${innerRoot}/packages/inner-pkg/src/brokers/foo`;

    const repoRoot = await cwdResolveBroker({
      startPath: FilePathStub({ value: deepStartPath }),
      kind: 'repo-root',
    });

    expect(repoRoot).toBe(innerRoot);

    const innerInventory = architecturePackageInventoryBroker({
      packageName: ContentTextStub({ value: 'inner-pkg' }),
      srcPath: AbsoluteFilePathStub({ value: `${repoRoot}/packages/inner-pkg/src` }),
      packageJsonPath: AbsoluteFilePathStub({
        value: `${repoRoot}/packages/inner-pkg/package.json`,
      }),
    });

    expect(String(innerInventory).split('\n')[0]).toBe('## inner-pkg (1 files)');

    const outerOnlyInventory = architecturePackageInventoryBroker({
      packageName: ContentTextStub({ value: 'outer-only-pkg' }),
      srcPath: AbsoluteFilePathStub({ value: `${repoRoot}/packages/outer-only-pkg/src` }),
      packageJsonPath: AbsoluteFilePathStub({
        value: `${repoRoot}/packages/outer-only-pkg/package.json`,
      }),
    });

    testbed.cleanup();

    expect(outerOnlyInventory).toBe('## outer-only-pkg (0 files)\n  (empty)');
  });

  it('VALID: {ordinary non-worktree checkout with one config} => resolves that single directory as the root', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'caller-repo-root-plain' }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      content: FileContentStub({ value: '{}' }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: 'packages/only-pkg/src/index.ts' }),
      content: FileContentStub({ value: 'export const onlyPkg = true;' }),
    });

    const repoRoot = await cwdResolveBroker({
      startPath: FilePathStub({ value: String(testbed.guildPath) }),
      kind: 'repo-root',
    });
    const expectedRoot = String(testbed.guildPath);

    testbed.cleanup();

    expect(repoRoot).toBe(expectedRoot);
  });
});
