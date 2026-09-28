import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { InstallRepoScaffoldResponder } from './install-repo-scaffold-responder';

// Every caller exercises targetProjectRoot: '/project', so the exact join tuples staged below are
// the only ones this responder ever composes and both files it checks always land at these paths.
const TARGET_PROJECT_ROOT = '/project';
const WORKTREES_DIR = FilePathStub({ value: '/project/worktrees' });
const GITIGNORE_PATH = FilePathStub({ value: '/project/.gitignore' });
const GITIGNORE_FILENAME = '.gitignore';

export const InstallRepoScaffoldResponderProxy = (): {
  callResponder: typeof InstallRepoScaffoldResponder;
  setupFreshRepo: () => void;
  setupDirPresentEntryMissing: (params: { gitignoreContent: string }) => void;
  setupDirPresentAllIgnored: (params: { gitignoreContent: string }) => void;
  setupDirMissingAllIgnored: (params: { gitignoreContent: string }) => void;
  getCreatedDirs: () => readonly unknown[];
  getWrittenGitignore: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const joinHandle = registerMock({ fn: join });
  const mkdirProxy = ensureDirProxy();
  const dirProxy = pathExistsProxy();
  const readProxy = readFileIfExistsProxy();
  const writeProxy = writeFileProxy();

  joinHandle
    .calledWith([TARGET_PROJECT_ROOT, locationsStatics.repoRoot.worktreesDir])
    .returns(WORKTREES_DIR);
  joinHandle.calledWith([TARGET_PROJECT_ROOT, GITIGNORE_FILENAME]).returns(GITIGNORE_PATH);

  return {
    callResponder: InstallRepoScaffoldResponder,

    // Neither worktrees/ nor .gitignore exist yet — the fresh-clone case.
    setupFreshRepo: (): void => {
      dirProxy.missing({ path: WORKTREES_DIR });
      readProxy.missing({ path: GITIGNORE_PATH });
      mkdirProxy.succeeds({ path: WORKTREES_DIR });
      writeProxy.succeeds({ path: GITIGNORE_PATH });
    },

    // worktrees/ already exists; .gitignore exists but is still missing at least one entry, so a
    // write is staged.
    setupDirPresentEntryMissing: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      dirProxy.present({ path: WORKTREES_DIR });
      readProxy.returns({ path: GITIGNORE_PATH, contents: gitignoreContent });
      writeProxy.succeeds({ path: GITIGNORE_PATH });
    },

    // worktrees/ already exists; .gitignore already carries every entry — the fully-scaffolded
    // case, where no write is staged at all so an attempted one fails the test.
    setupDirPresentAllIgnored: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      dirProxy.present({ path: WORKTREES_DIR });
      readProxy.returns({ path: GITIGNORE_PATH, contents: gitignoreContent });
    },

    // worktrees/ is missing but .gitignore already carries every entry — the directory and the
    // ignore lines are decided independently.
    setupDirMissingAllIgnored: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      dirProxy.missing({ path: WORKTREES_DIR });
      readProxy.returns({ path: GITIGNORE_PATH, contents: gitignoreContent });
      mkdirProxy.succeeds({ path: WORKTREES_DIR });
    },

    getCreatedDirs: (): readonly unknown[] =>
      mkdirProxy.getCallsFor({ path: WORKTREES_DIR }).map((call) => call[0]),
    getWrittenGitignore: (): unknown => writeProxy.writtenContentsFor({ path: GITIGNORE_PATH }),
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy
        .getCallsFor({ path: GITIGNORE_PATH })
        .map((call) => ({ path: call[0], content: call[1] })),
  };
};
