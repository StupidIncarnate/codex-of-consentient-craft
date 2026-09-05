import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { wardGitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

import { gitDiffUncommittedBroker } from './git-diff-uncommitted-broker';

// The unit suite mocks `spawn` and answers every `git` call positionally, so it cannot tell a real
// untracked file from a staged one — both are just the next mocked answer. Proving the untracked
// half is really there, and that .gitignore really filters it, needs a real repo with a real
// working tree.
describe('gitDiffUncommittedBroker (integration) — real working tree, tracked and untracked', () => {
  const git = wardGitWorktreeFixtureHarness();

  it('VALID: {one committed file, one edited tracked file, one brand-new file} => returns the edit and the new file, never the committed one', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-diff-uncommitted' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/repo` });

    await git.initRepo({ repoPath });

    // Committed, so HEAD already has it — it belongs to `--committed`, not here.
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'committed-work.ts' }),
      content: 'export const committed = 1;\n',
    });

    // An edit to a TRACKED file. `git diff` reports this one.
    git.writeUncommittedFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'base.txt' }),
      content: 'base edited but never committed\n',
    });

    // A file git has never seen. `git diff` reports NOTHING for it — this is the whole reason the
    // broker takes a second reading.
    git.writeUncommittedFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'brand-new.ts' }),
      content: 'export const brandNew = 2;\n',
    });

    const result = await gitDiffUncommittedBroker({ cwd: repoPath });

    testbed.cleanup();

    // toStrictEqual on the COMPLETE list: asserting brand-new.ts is present would not show that
    // committed-work.ts stayed out, and asserting its absence alone would be vacuous.
    expect(result).toStrictEqual([
      GitRelativePathStub({ value: 'base.txt' }),
      GitRelativePathStub({ value: 'brand-new.ts' }),
    ]);
  }, 30_000);

  it('VALID: {an untracked file matched by .gitignore} => the ignored file stays out of scope', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-diff-uncommitted-ignored' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/repo` });

    await git.initRepo({ repoPath });
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: '.gitignore' }),
      content: 'dist/\n',
    });

    git.writeUncommittedFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'dist/generated.js' }),
      content: 'module.exports = {};\n',
    });
    git.writeUncommittedFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'src/real.ts' }),
      content: 'export const real = 1;\n',
    });

    const result = await gitDiffUncommittedBroker({ cwd: repoPath });

    testbed.cleanup();

    expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/real.ts' })]);
  }, 30_000);
});
