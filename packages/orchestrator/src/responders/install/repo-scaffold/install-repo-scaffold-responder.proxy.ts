import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { InstallRepoScaffoldResponder } from './install-repo-scaffold-responder';

// Every caller exercises targetProjectRoot: '/project', so the exact join tuples staged below are
// the only ones this responder ever composes and both files it checks always land at these paths.
const TARGET_PROJECT_ROOT = '/project';
const WORKTREES_DIR = FilePathStub({ value: '/project/worktrees' });
const GITIGNORE_PATH = FilePathStub({ value: '/project/.gitignore' });
const GITIGNORE_FILENAME = '.gitignore';
const NOT_FOUND_ERROR = (): Error =>
  Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

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
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = writeFileProxy();

  joinHandle
    .calledWith([TARGET_PROJECT_ROOT, locationsStatics.repoRoot.worktreesDir])
    .returns(WORKTREES_DIR);
  joinHandle.calledWith([TARGET_PROJECT_ROOT, GITIGNORE_FILENAME]).returns(GITIGNORE_PATH);

  return {
    callResponder: InstallRepoScaffoldResponder,

    // Neither worktrees/ nor .gitignore exist yet — the fresh-clone case.
    setupFreshRepo: (): void => {
      isAccessibleProxy.rejects({ filePath: WORKTREES_DIR, error: NOT_FOUND_ERROR() });
      isAccessibleProxy.rejects({ filePath: GITIGNORE_PATH, error: NOT_FOUND_ERROR() });
      mkdirProxy.succeeds({ path: WORKTREES_DIR });
      writeProxy.succeeds({ path: GITIGNORE_PATH });
    },

    // worktrees/ already exists; .gitignore exists but is still missing at least one entry, so a
    // write is staged.
    setupDirPresentEntryMissing: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      isAccessibleProxy.resolves({ filePath: WORKTREES_DIR });
      isAccessibleProxy.resolves({ filePath: GITIGNORE_PATH });
      readProxy.resolves({ filePath: GITIGNORE_PATH, content: gitignoreContent });
      writeProxy.succeeds({ path: GITIGNORE_PATH });
    },

    // worktrees/ already exists; .gitignore already carries every entry — the fully-scaffolded
    // case, where no write is staged at all so an attempted one fails the test.
    setupDirPresentAllIgnored: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      isAccessibleProxy.resolves({ filePath: WORKTREES_DIR });
      isAccessibleProxy.resolves({ filePath: GITIGNORE_PATH });
      readProxy.resolves({ filePath: GITIGNORE_PATH, content: gitignoreContent });
    },

    // worktrees/ is missing but .gitignore already carries every entry — the directory and the
    // ignore lines are decided independently.
    setupDirMissingAllIgnored: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      isAccessibleProxy.rejects({ filePath: WORKTREES_DIR, error: NOT_FOUND_ERROR() });
      isAccessibleProxy.resolves({ filePath: GITIGNORE_PATH });
      readProxy.resolves({ filePath: GITIGNORE_PATH, content: gitignoreContent });
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
