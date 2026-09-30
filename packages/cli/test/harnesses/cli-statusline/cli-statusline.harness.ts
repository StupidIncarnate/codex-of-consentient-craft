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
import { Buffer } from '#gateway/node/buffer';
import { ensureDirSync, existsSync, readFileSync, writeFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { deleteEnv, getEnv, setEnv, setStdin, stderr, stdout } from '#gateway/node/process';
import { Readable } from '#gateway/node/stream';


const SNAPSHOT_FILENAME = 'rate-limits.json';
const HISTORY_FILENAME = 'rate-limits-history.jsonl';

// `write` lives on the stream's prototype, so the capture sets an own property and restore removes
// it again rather than leaving a bound copy of the original behind.
const captureWrites = ({
  stream,
}: {
  stream: typeof stdout | typeof stderr;
}): {
  getOutput: () => readonly unknown[];
  restore: () => void;
} => {
  const writes: unknown[] = [];
  const ownWrite = Object.getOwnPropertyDescriptor(stream, 'write');
  Object.defineProperty(stream, 'write', {
    configurable: true,
    writable: true,
    value: (chunk: unknown): boolean => {
      writes.push(chunk);
      return true;
    },
  });
  return {
    getOutput: (): readonly unknown[] => writes,
    restore: (): void => {
      if (ownWrite === undefined) {
        Reflect.deleteProperty(stream, 'write');
      } else {
        Object.defineProperty(stream, 'write', ownWrite);
      }
    },
  };
};

export const cliStatuslineHarness = (): {
  setupHome: ({ tempDir }: { tempDir: string }) => { restore: () => void };
  setupStdin: ({ data }: { data: string }) => { restore: () => void };
  captureStdout: () => {
    getOutput: () => readonly unknown[];
    restore: () => void;
  };
  captureStderr: () => {
    getOutput: () => readonly unknown[];
    restore: () => void;
  };
  readSnapshot: ({ tempDir }: { tempDir: string }) => string | null;
  readHistory: ({ tempDir }: { tempDir: string }) => string | null;
  snapshotExists: ({ tempDir }: { tempDir: string }) => boolean;
} => ({
  setupHome: ({ tempDir }: { tempDir: string }): { restore: () => void } => {
    const savedHome = getEnv('DUNGEONMASTER_HOME');
    setEnv('DUNGEONMASTER_HOME', tempDir);
    ensureDirSync(tempDir);
    // A ledger stamped NOW, so usageLedgerScanBroker takes its throttle path instead of walking the
    // developer's own ~/.claude/projects. `packages/testing/src/jest.setup-home.js` carries the full
    // reasoning and seeds the same file into the process-wide sandbox home; every harness that
    // re-points DUNGEONMASTER_HOME at a fresh directory owes it again, because a new directory has
    // no ledger and the default one is stamped at the epoch.
    writeFileSync(
      join(tempDir, 'usage-ledger.json'),
      JSON.stringify({
        buckets: {},
        cursors: {},
        ceilings: { fiveHour: null, sevenDay: null },
        updatedAt: new Date().toISOString(),
      }),
    );
    return {
      restore: (): void => {
        if (savedHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', savedHome);
        }
      },
    };
  },

  setupStdin: ({ data }: { data: string }): { restore: () => void } =>
    setStdin({ stream: Readable.from(Buffer.from(data, 'utf8')) }),

  captureStdout: (): {
    getOutput: () => readonly unknown[];
    restore: () => void;
  } => captureWrites({ stream: stdout }),

  captureStderr: (): {
    getOutput: () => readonly unknown[];
    restore: () => void;
  } => captureWrites({ stream: stderr }),

  readSnapshot: ({ tempDir }: { tempDir: string }): string | null => {
    const snapshotPath = join(tempDir, SNAPSHOT_FILENAME);
    if (!existsSync(snapshotPath)) {
      return null;
    }
    return readFileSync(snapshotPath);
  },

  readHistory: ({ tempDir }: { tempDir: string }): string | null => {
    const historyPath = join(tempDir, HISTORY_FILENAME);
    if (!existsSync(historyPath)) {
      return null;
    }
    return readFileSync(historyPath);
  },

  snapshotExists: ({ tempDir }: { tempDir: string }): boolean =>
    existsSync(join(tempDir, SNAPSHOT_FILENAME)),
});
