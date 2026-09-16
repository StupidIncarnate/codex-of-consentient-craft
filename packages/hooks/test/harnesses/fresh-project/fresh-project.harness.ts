/**
 * PURPOSE: Creates a real on-disk project directory holding only a package.json — no .claude/
 * directory at all. Reach for this over installTestbedCreateBroker when a test needs a genuinely
 * fresh repo: that broker pre-creates .claude/ to satisfy other packages' install preconditions,
 * which makes it unable to reproduce a target project where .claude/ does not exist yet.
 *
 * USAGE:
 * const project = freshProjectHarness();
 * const projectPath = project.create();
 * const result = await InstallFlow({
 *   context: { targetProjectRoot: projectPath, dungeonmasterRoot: projectPath },
 * });
 * const settings = project.readSettings({ projectPath });
 * project.cleanup();
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const freshProjectHarness = (): {
  create: () => FilePath;
  readSettings: (params: { projectPath: FilePath }) => unknown;
  cleanup: () => void;
} => {
  const createdDirs: FilePath[] = [];

  return {
    create: (): FilePath => {
      const projectPath = FilePathStub({
        value: fs.mkdtempSync(path.join(os.tmpdir(), 'dm-fresh-project-')),
      });
      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({ name: 'fresh-project', version: '1.0.0' }, null, 2),
      );
      createdDirs.push(projectPath);
      return projectPath;
    },

    readSettings: ({ projectPath }: { projectPath: FilePath }): unknown => {
      const settingsPath = path.join(projectPath, '.claude', 'settings.json');
      return fs.existsSync(settingsPath)
        ? (JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as unknown)
        : null;
    },

    cleanup: (): void => {
      createdDirs.forEach((dir) => {
        fs.rmSync(dir, { recursive: true, force: true });
      });
      createdDirs.length = 0;
    },
  };
};
