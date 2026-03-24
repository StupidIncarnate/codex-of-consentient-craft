/**
 * PURPOSE: Manages guild directory setup and cleanup for E2E tests
 *
 * USAGE:
 * const env = environmentHarness({ guildPath: '/tmp/dm-e2e-test' });
 * // beforeEach: creates guild directory
 * // Call env.cleanup() or rely on afterEach if wired
 */
import * as fs from 'fs';
import * as os from 'os';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

export const environmentHarness = ({
  guildPath,
}: {
  guildPath: string;
}): {
  beforeEach: () => void;
  setupGuildPath: () => void;
  cleanup: () => void;
  getHomedir: () => FilePath;
} => {
  const setupGuildPath = (): void => {
    fs.mkdirSync(guildPath, { recursive: true });
  };

  const cleanup = (): void => {
    fs.rmSync(guildPath, { recursive: true, force: true });
  };

  const getHomedir = (): FilePath => FilePathStub({ value: os.homedir() });

  return {
    beforeEach: setupGuildPath,
    setupGuildPath,
    cleanup,
    getHomedir,
  };
};
