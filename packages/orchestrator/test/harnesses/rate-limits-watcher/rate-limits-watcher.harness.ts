/**
 * PURPOSE: Manages rate-limits.json file lifecycle, DUNGEONMASTER_HOME env, watcher state, bus subscriptions, and stderr capture for orchestrator integration tests
 *
 * USAGE:
 * const harness = rateLimitsWatcherHarness();
 * const env = harness.setupHome({ tempDir: testbed.guildPath });
 * harness.writeSnapshot({ tempDir: testbed.guildPath, snapshot });
 * const sub = harness.subscribeRateLimitsUpdated();
 * await harness.pollUntil({ condition: () => harness.getStateSnapshot() !== null, timeoutMs: ElapsedMsStub({ value: 8000 }) });
 * sub.removeAll();
 * harness.resetWatcher();
 * env.restore();
 */
import * as fs from 'fs';
import * as path from 'path';

import type { GuildPath, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { ElapsedMsStub } from '../../../src/contracts/elapsed-ms/elapsed-ms.stub';
import { rateLimitsBootstrapState } from '../../../src/state/rate-limits-bootstrap/rate-limits-bootstrap-state';
import { rateLimitsState } from '../../../src/state/rate-limits/rate-limits-state';
import { orchestrationEventsState } from '../../../src/state/orchestration-events/orchestration-events-state';

type ElapsedMs = ReturnType<typeof ElapsedMsStub>;

const SNAPSHOT_FILENAME = 'rate-limits.json';
const POLL_STEP_MS = ElapsedMsStub({ value: 50 });

export const rateLimitsWatcherHarness = (): {
  setupHome: ({ tempDir }: { tempDir: GuildPath }) => { restore: () => void };
  writeSnapshot: ({
    tempDir,
    snapshot,
  }: {
    tempDir: GuildPath;
    snapshot: RateLimitsSnapshot;
  }) => void;
  writeRaw: ({ tempDir, content }: { tempDir: GuildPath; content: string }) => void;
  deleteSnapshot: ({ tempDir }: { tempDir: GuildPath }) => void;
  pollUntil: ({
    condition,
    timeoutMs,
  }: {
    condition: () => boolean;
    timeoutMs: ElapsedMs;
  }) => Promise<void>;
  delayMs: ({ ms }: { ms: ElapsedMs }) => Promise<void>;
  getStateSnapshot: () => RateLimitsSnapshot | null;
  resetWatcher: () => void;
  subscribeRateLimitsUpdated: ({
    handler,
  }: {
    handler: (event: { processId: unknown; payload: unknown }) => void;
  }) => { removeAll: () => void };
  captureStderr: () => {
    getLines: () => readonly unknown[];
    hasLineWithSubstring: ({ substring }: { substring: string }) => boolean;
    restore: () => void;
  };
} => ({
  setupHome: ({ tempDir }: { tempDir: GuildPath }): { restore: () => void } => {
    const savedHome = process.env.DUNGEONMASTER_HOME;
    process.env.DUNGEONMASTER_HOME = tempDir;
    fs.mkdirSync(tempDir, { recursive: true });

    return {
      restore: (): void => {
        const snapshotPath = path.join(tempDir, SNAPSHOT_FILENAME);
        if (fs.existsSync(snapshotPath)) {
          fs.rmSync(snapshotPath, { force: true });
        }
        if (savedHome === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
        } else {
          process.env.DUNGEONMASTER_HOME = savedHome;
        }
      },
    };
  },

  writeSnapshot: ({
    tempDir,
    snapshot,
  }: {
    tempDir: GuildPath;
    snapshot: RateLimitsSnapshot;
  }): void => {
    fs.writeFileSync(path.join(tempDir, SNAPSHOT_FILENAME), JSON.stringify(snapshot));
  },

  writeRaw: ({ tempDir, content }: { tempDir: GuildPath; content: string }): void => {
    fs.writeFileSync(path.join(tempDir, SNAPSHOT_FILENAME), content);
  },

  deleteSnapshot: ({ tempDir }: { tempDir: GuildPath }): void => {
    const snapshotPath = path.join(tempDir, SNAPSHOT_FILENAME);
    if (fs.existsSync(snapshotPath)) {
      fs.rmSync(snapshotPath, { force: true });
    }
  },

  pollUntil: async ({
    condition,
    timeoutMs,
  }: {
    condition: () => boolean;
    timeoutMs: ElapsedMs;
  }): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const start = Date.now();
      const tick = (): void => {
        if (condition()) {
          resolve();
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`pollUntil timed out after ${String(timeoutMs)}ms`));
          return;
        }
        setTimeout(tick, POLL_STEP_MS);
      };
      tick();
    }),

  delayMs: async ({ ms }: { ms: ElapsedMs }): Promise<void> =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),

  getStateSnapshot: (): RateLimitsSnapshot | null => rateLimitsState.get(),

  resetWatcher: (): void => {
    rateLimitsBootstrapState.clear();
    rateLimitsState.clear();
    orchestrationEventsState.removeAllListeners();
  },

  subscribeRateLimitsUpdated: ({
    handler,
  }: {
    handler: (event: { processId: unknown; payload: unknown }) => void;
  }): { removeAll: () => void } => {
    orchestrationEventsState.on({ type: 'rate-limits-updated', handler });
    return {
      removeAll: (): void => {
        orchestrationEventsState.removeAllListeners();
      },
    };
  },

  captureStderr: (): {
    getLines: () => readonly unknown[];
    hasLineWithSubstring: ({ substring }: { substring: string }) => boolean;
    restore: () => void;
  } => {
    const lines: unknown[] = [];
    const original = process.stderr.write.bind(process.stderr);
    const captureWrite = (chunk: unknown): boolean => {
      lines.push(chunk);
      return true;
    };
    process.stderr.write = captureWrite as typeof process.stderr.write;
    return {
      getLines: (): readonly unknown[] => lines,
      hasLineWithSubstring: ({ substring }: { substring: string }): boolean =>
        lines.some((line) => String(line).includes(substring)),
      restore: (): void => {
        process.stderr.write = original;
      },
    };
  },
});
