/**
 * PURPOSE: Creates a real on-disk project directory holding only a package.json — no .claude/
 * directory at all. Reach for this over installTestbedCreateBroker when a test needs a genuinely
 * fresh repo: that broker pre-creates .claude/ to satisfy other packages' install preconditions,
 * which makes it unable to reproduce a target project where .claude/ does not exist yet.
 *
 * USAGE:
 * const project = freshProjectHarness();
 * const projectPath = await project.create();
 * const result = await InstallFlow({
 *   context: { targetProjectRoot: projectPath, dungeonmasterRoot: projectPath },
 * });
 * const settings = project.readSettings({ projectPath });
 * project.cleanup();
 */
import { readJsonFileSyncIfExists, rmSync } from '#gateway/node/fs';
import { mkdtemp, writeFile } from '#gateway/node/fs__promises';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const freshProjectHarness = (): {
  create: () => Promise<FilePath>;
  readSettings: (params: { projectPath: FilePath }) => unknown;
  cleanup: () => void;
} => {
  const createdDirs: FilePath[] = [];

  return {
    create: async (): Promise<FilePath> => {
      const projectPath = FilePathStub({
        value: await mkdtemp(join(tmpdir(), 'dm-fresh-project-')),
      });
      await writeFile(
        join(projectPath, 'package.json'),
        JSON.stringify({ name: 'fresh-project', version: '1.0.0' }, null, 2),
      );
      createdDirs.push(projectPath);
      return projectPath;
    },

    readSettings: ({ projectPath }: { projectPath: FilePath }): unknown => {
      return readJsonFileSyncIfExists(join(projectPath, '.claude', 'settings.json'));
    },

    cleanup: (): void => {
      createdDirs.forEach((dir) => {
        rmSync(dir, { recursive: true, force: true });
      });
      createdDirs.length = 0;
    },
  };
};
