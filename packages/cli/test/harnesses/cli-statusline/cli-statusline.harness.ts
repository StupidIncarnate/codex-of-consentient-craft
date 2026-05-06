/**
 * PURPOSE: Manages stdin replacement, stdout capture, DUNGEONMASTER_HOME env, and on-disk file reads for CliFlow statusline-tap integration tests
 *
 * USAGE:
 * const harness = cliStatuslineHarness();
 * const env = harness.setupHome({ tempDir: testbed.guildPath });
 * const stdin = harness.setupStdin({ data: FileContentsStub({ value: '{"rate_limits":{...}}' }) });
 * const stdout = harness.captureStdout();
 * await CliFlow({ command: 'statusline-tap', context });
 * stdin.restore();
 * stdout.restore();
 * const snapshot = harness.readSnapshot({ tempDir: testbed.guildPath });
 * env.restore();
 */
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

import type { FileContents, GuildPath } from '@dungeonmaster/shared/contracts';

const SNAPSHOT_FILENAME = 'rate-limits.json';
const HISTORY_FILENAME = 'rate-limits-history.jsonl';

export const cliStatuslineHarness = (): {
  setupHome: ({ tempDir }: { tempDir: GuildPath }) => { restore: () => void };
  setupStdin: ({ data }: { data: FileContents }) => { restore: () => void };
  captureStdout: () => {
    getOutput: () => readonly unknown[];
    restore: () => void;
  };
  captureStderr: () => {
    getOutput: () => readonly unknown[];
    restore: () => void;
  };
  readSnapshot: ({ tempDir }: { tempDir: GuildPath }) => FileContents | null;
  readHistory: ({ tempDir }: { tempDir: GuildPath }) => FileContents | null;
  snapshotExists: ({ tempDir }: { tempDir: GuildPath }) => boolean;
} => ({
  setupHome: ({ tempDir }: { tempDir: GuildPath }): { restore: () => void } => {
    const savedHome = process.env.DUNGEONMASTER_HOME;
    process.env.DUNGEONMASTER_HOME = tempDir;
    fs.mkdirSync(tempDir, { recursive: true });
    return {
      restore: (): void => {
        if (savedHome === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
        } else {
          process.env.DUNGEONMASTER_HOME = savedHome;
        }
      },
    };
  },

  setupStdin: ({ data }: { data: FileContents }): { restore: () => void } => {
    const stdinOriginal = Object.getOwnPropertyDescriptor(process, 'stdin');
    const stream = Readable.from(Buffer.from(data, 'utf8'));
    Object.defineProperty(process, 'stdin', {
      configurable: true,
      get: () => stream,
    });
    return {
      restore: (): void => {
        if (stdinOriginal !== undefined) {
          Object.defineProperty(process, 'stdin', stdinOriginal);
        }
      },
    };
  },

  captureStdout: (): {
    getOutput: () => readonly unknown[];
    restore: () => void;
  } => {
    const writes: unknown[] = [];
    const original = process.stdout.write.bind(process.stdout);
    const captureWrite = (chunk: unknown): boolean => {
      writes.push(chunk);
      return true;
    };
    process.stdout.write = captureWrite as typeof process.stdout.write;
    return {
      getOutput: (): readonly unknown[] => writes,
      restore: (): void => {
        process.stdout.write = original;
      },
    };
  },

  captureStderr: (): {
    getOutput: () => readonly unknown[];
    restore: () => void;
  } => {
    const writes: unknown[] = [];
    const original = process.stderr.write.bind(process.stderr);
    const captureWrite = (chunk: unknown): boolean => {
      writes.push(chunk);
      return true;
    };
    process.stderr.write = captureWrite as typeof process.stderr.write;
    return {
      getOutput: (): readonly unknown[] => writes,
      restore: (): void => {
        process.stderr.write = original;
      },
    };
  },

  readSnapshot: ({ tempDir }: { tempDir: GuildPath }): FileContents | null => {
    const snapshotPath = path.join(tempDir, SNAPSHOT_FILENAME);
    if (!fs.existsSync(snapshotPath)) {
      return null;
    }
    return fs.readFileSync(snapshotPath, 'utf8') as FileContents;
  },

  readHistory: ({ tempDir }: { tempDir: GuildPath }): FileContents | null => {
    const historyPath = path.join(tempDir, HISTORY_FILENAME);
    if (!fs.existsSync(historyPath)) {
      return null;
    }
    return fs.readFileSync(historyPath, 'utf8') as FileContents;
  },

  snapshotExists: ({ tempDir }: { tempDir: GuildPath }): boolean =>
    fs.existsSync(path.join(tempDir, SNAPSHOT_FILENAME)),
});
