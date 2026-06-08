/**
 * PURPOSE: Manages guild directory setup and cleanup for E2E tests
 *
 * USAGE:
 * const env = environmentHarness({ guildPath: '/tmp/dm-e2e-test' });
 * // beforeEach: creates guild directory and clears stale session JSONL files
 * // Call env.cleanup() or rely on afterEach if wired
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
  const clearStaleJsonlForGuild = (): void => {
    // Default sessionId stubs share `e2e-session-00000000-0000-0000-0000-000000000000`,
    // and JSONL files are keyed by encoded cwd (guildPath). Without this clear, a JSONL
    // written by a prior test with the same guildPath gets replayed into the next test
    // via subscribe-quest before the current fake CLI overwrites it — UI shows stale text.
    const jsonlDir = FilePathStub({
      value: path.join(os.homedir(), '.claude', 'projects', guildPath.replace(/\//gu, '-')),
    });
    fs.rmSync(jsonlDir, { recursive: true, force: true });
  };

  const setupGuildPath = (): void => {
    clearStaleJsonlForGuild();
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
