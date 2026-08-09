import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWorktreesScaffoldResponder } from './install-worktrees-scaffold-responder';

// Every caller exercises targetProjectRoot: '/project' (the real, unstaged pathJoin passthrough
// resolves it to these two exact paths), so both files this responder checks always land here.
const WORKTREES_DIR = FilePathStub({ value: '/project/worktrees' });
const GITIGNORE_PATH = FilePathStub({ value: '/project/.gitignore' });
const NOT_FOUND_ERROR = (): Error =>
  Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

export const InstallWorktreesScaffoldResponderProxy = (): {
  callResponder: typeof InstallWorktreesScaffoldResponder;
  setupFreshRepo: () => void;
  setupDirPresentNoEntry: (params: { gitignoreContent: string }) => void;
  setupDirPresentAlreadyIgnored: (params: { gitignoreContent: string }) => void;
  setupDirMissingAlreadyIgnored: (params: { gitignoreContent: string }) => void;
  getCreatedDirs: () => readonly unknown[];
  getWrittenGitignore: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallWorktreesScaffoldResponder,

    // Neither worktrees/ nor .gitignore exist yet — the fresh-clone case.
    setupFreshRepo: (): void => {
      isAccessibleProxy.rejects({ filePath: WORKTREES_DIR, error: NOT_FOUND_ERROR() });
      isAccessibleProxy.rejects({ filePath: GITIGNORE_PATH, error: NOT_FOUND_ERROR() });
      mkdirProxy.succeeds({ filepath: WORKTREES_DIR });
      writeProxy.succeeds({ filePath: GITIGNORE_PATH });
    },

    // worktrees/ already exists; .gitignore exists but carries no worktrees/ line yet.
    setupDirPresentNoEntry: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      isAccessibleProxy.resolves({ filePath: WORKTREES_DIR });
      isAccessibleProxy.resolves({ filePath: GITIGNORE_PATH });
      readProxy.resolves({ filePath: GITIGNORE_PATH, content: gitignoreContent });
      writeProxy.succeeds({ filePath: GITIGNORE_PATH });
    },

    // worktrees/ already exists; .gitignore already ignores it — the fully-scaffolded case.
    setupDirPresentAlreadyIgnored: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      isAccessibleProxy.resolves({ filePath: WORKTREES_DIR });
      isAccessibleProxy.resolves({ filePath: GITIGNORE_PATH });
      readProxy.resolves({ filePath: GITIGNORE_PATH, content: gitignoreContent });
    },

    // worktrees/ is missing but .gitignore already ignores it — the two decisions run independently.
    setupDirMissingAlreadyIgnored: ({ gitignoreContent }: { gitignoreContent: string }): void => {
      isAccessibleProxy.rejects({ filePath: WORKTREES_DIR, error: NOT_FOUND_ERROR() });
      isAccessibleProxy.resolves({ filePath: GITIGNORE_PATH });
      readProxy.resolves({ filePath: GITIGNORE_PATH, content: gitignoreContent });
      mkdirProxy.succeeds({ filepath: WORKTREES_DIR });
    },

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
    getWrittenGitignore: (): unknown => writeProxy.getWrittenFor({ filePath: GITIGNORE_PATH }),
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
