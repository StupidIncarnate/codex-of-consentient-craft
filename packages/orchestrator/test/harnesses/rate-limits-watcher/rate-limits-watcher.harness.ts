/**
 * PURPOSE: Owns every on-disk and in-memory location a rate-limits integration test needs — the
 * dungeonmaster home, the usage ledger the guardrail measures from, the persisted dispatch state,
 * the rate-limits.json the watcher polls, the watcher's cadence, and the in-memory dispatch mirror
 * the loop's getIsPlaying() reads. Reach for this rather than writing any of them from a scenario
 * file: an integration test may import no node builtin at all, and the guardrail reads four
 * separate locations that have to agree with one another.
 *
 * `begin` owns the whole lifecycle — temp home, env, seeds — and the `end` it hands back stops the
 * watcher, lets the last in-flight pass land, clears the in-memory mirrors and removes the dir.
 *
 * USAGE:
 * const harness = rateLimitsWatcherHarness();
 * const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'hold-raise' }) });
 * harness.seedLedger({ tempDir, fiveHour: null, sevenDay: 1_000_000, hourAt, tokens: 900_000 });
 * harness.seedDispatch({ tempDir, mode: 'node-playing' });
 * await harness.awaitHoldDetail({ tempDir, detail: '7d window at 90% — dispatch holds until it resets' });
 * await end();
 */
import * as fs from 'fs';
import * as path from 'path';

import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import type { BaseNameStub } from '@dungeonmaster/testing';
import type { GuildPath, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';
import type { DispatchHoldStub, DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { ElapsedMsStub } from '../../../src/contracts/elapsed-ms/elapsed-ms.stub';
import { orchestrationDispatchState } from '../../../src/state/orchestration-dispatch/orchestration-dispatch-state';
import { rateLimitsBootstrapState } from '../../../src/state/rate-limits-bootstrap/rate-limits-bootstrap-state';
import { rateLimitsState } from '../../../src/state/rate-limits/rate-limits-state';
import { orchestrationEventsState } from '../../../src/state/orchestration-events/orchestration-events-state';

type BaseName = ReturnType<typeof BaseNameStub>;
type DispatchHold = ReturnType<typeof DispatchHoldStub>;
type DispatchState = ReturnType<typeof DispatchStateStub>;
interface PersistedDispatchState {
  mode: DispatchState['mode'];
  hold: DispatchHold | null | undefined;
  mcpHeartbeatAt: DispatchState['mcpHeartbeatAt'];
  updatedAt: DispatchState['updatedAt'];
}

const SNAPSHOT_FILENAME = 'rate-limits.json';
const USAGE_LEDGER_FILENAME = 'usage-ledger.json';
const DISPATCH_STATE_FILENAME = 'dispatch-state.json';
const GUILD_CONFIG_FILENAME = 'config.json';

// The watcher's production cadence is 5s, and every wait here is denominated in POLL CYCLES rather
// than seconds. Bootstrapping at 25ms lets a test observe MORE cycles in milliseconds than a
// seconds-long wait against the default ever did: QUIET_WINDOW_MS spans twenty of them.
const POLL_INTERVAL_MS = ElapsedMsStub({ value: 25 });
const POLL_STEP_MS = ElapsedMsStub({ value: 50 });
// A deadline, not a sleep — pollUntil resolves the instant its condition holds, so this costs wall
// clock only when the condition genuinely never arrives.
const POLL_TIMEOUT_MS = ElapsedMsStub({ value: 8000 });
const QUIET_WINDOW_MS = ElapsedMsStub({ value: 500 });

export const rateLimitsWatcherHarness = (): {
  begin: ({ name }: { name: BaseName }) => { tempDir: GuildPath; end: () => Promise<void> };
  writeSnapshot: (params: { tempDir: GuildPath; snapshot: RateLimitsSnapshot }) => Promise<void>;
  writeRaw: (params: { tempDir: GuildPath; content: string }) => Promise<void>;
  seedLedger: (params: {
    tempDir: GuildPath;
    fiveHour: number | null;
    sevenDay: number | null;
    hourAt: number;
    tokens: number;
  }) => Promise<void>;
  seedDispatch: (params: {
    tempDir: GuildPath;
    mode: DispatchState['mode'];
    hold?: DispatchHold;
  }) => Promise<void>;
  readDispatch: ({ tempDir }: { tempDir: GuildPath }) => PersistedDispatchState;
  awaitHoldDetail: ({ tempDir, detail }: { tempDir: GuildPath; detail: string }) => Promise<void>;
  awaitHoldCleared: ({ tempDir }: { tempDir: GuildPath }) => Promise<void>;
  awaitQuiet: () => Promise<void>;
  pollUntil: ({ condition }: { condition: () => boolean }) => Promise<void>;
  getStateSnapshot: () => RateLimitsSnapshot | null;
  getIsPlaying: () => boolean;
  getIsPlayRequested: () => boolean;
  resetWatcher: () => void;
  resetDispatchState: () => void;
  subscribeRateLimitsUpdated: ({
    handler,
  }: {
    handler: (event: { processId: unknown; payload: unknown }) => void;
  }) => { removeAll: () => void };
  collectRateLimitsUpdated: () => {
    eventsFrom: ({ processId }: { processId: string }) => readonly {
      processId: unknown;
      payload: unknown;
    }[];
  };
  captureStderr: () => {
    hasLineWithSubstring: ({ substring }: { substring: string }) => boolean;
    restore: () => void;
  };
} => {
  const core = {
    writeSnapshot: async ({
      tempDir,
      snapshot,
    }: {
      tempDir: GuildPath;
      snapshot: RateLimitsSnapshot;
    }): Promise<void> => {
      await fs.promises.writeFile(path.join(tempDir, SNAPSHOT_FILENAME), JSON.stringify(snapshot));
    },

    writeRaw: async ({
      tempDir,
      content,
    }: {
      tempDir: GuildPath;
      content: string;
    }): Promise<void> => {
      await fs.promises.writeFile(path.join(tempDir, SNAPSHOT_FILENAME), content);
    },

    // One hour of measured spend and the two LEARNED CEILINGS, stamped NOW so the scan takes its
    // throttle path and hands this file straight back. Only `tokens` (input tokens) carries a
    // count, because its weight is 1 — the weighted total the guardrail divides by a ceiling is
    // then the number the test passed in, with no arithmetic in the scenario file to get wrong.
    seedLedger: async ({
      tempDir,
      fiveHour,
      sevenDay,
      hourAt,
      tokens,
    }: {
      tempDir: GuildPath;
      fiveHour: number | null;
      sevenDay: number | null;
      hourAt: number;
      tokens: number;
    }): Promise<void> => {
      await fs.promises.writeFile(
        path.join(tempDir, USAGE_LEDGER_FILENAME),
        JSON.stringify({
          buckets: {
            [String(hourAt)]: { input: tokens, cacheCreation: 0, cacheRead: 0, output: 0 },
          },
          cursors: {},
          ceilings: { fiveHour, sevenDay },
          updatedAt: new Date().toISOString(),
        }),
      );
    },

    seedDispatch: async ({
      tempDir,
      mode,
      hold,
    }: {
      tempDir: GuildPath;
      mode: DispatchState['mode'];
      hold?: DispatchHold;
    }): Promise<void> => {
      await fs.promises.writeFile(
        path.join(tempDir, DISPATCH_STATE_FILENAME),
        JSON.stringify({
          mode,
          ...(hold === undefined ? {} : { hold }),
          updatedAt: new Date().toISOString(),
        }),
      );
    },

    // Reads the file WITHOUT coalescing: an absent `hold` key comes back undefined and an
    // explicitly cleared one comes back null, which is the difference between "the guardrail never
    // wrote" and "the guardrail lifted the hold".
    readDispatch: ({ tempDir }: { tempDir: GuildPath }): PersistedDispatchState => {
      const raw = fs.readFileSync(path.join(tempDir, DISPATCH_STATE_FILENAME), 'utf-8');
      const parsed = JSON.parse(raw) as {
        mode: DispatchState['mode'];
        hold?: DispatchHold | null;
        mcpHeartbeatAt?: DispatchState['mcpHeartbeatAt'];
        updatedAt: DispatchState['updatedAt'];
      };
      return {
        mode: parsed.mode,
        hold: parsed.hold,
        mcpHeartbeatAt: parsed.mcpHeartbeatAt,
        updatedAt: parsed.updatedAt,
      };
    },

    pollUntil: async ({ condition }: { condition: () => boolean }): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const tick = (): void => {
          if (condition()) {
            resolve();
            return;
          }
          if (Date.now() - start >= POLL_TIMEOUT_MS) {
            reject(new Error(`pollUntil timed out after ${String(POLL_TIMEOUT_MS)}ms`));
            return;
          }
          setTimeout(tick, POLL_STEP_MS);
        };
        tick();
      }),

    // Twenty poll cycles of silence — long enough for a claim that nothing was written to mean
    // something, and the settle a raise needs before the in-memory mirror is read.
    awaitQuiet: async (): Promise<void> =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, QUIET_WINDOW_MS);
      }),

    getStateSnapshot: (): RateLimitsSnapshot | null => rateLimitsState.get(),

    getIsPlaying: (): boolean => orchestrationDispatchState.getIsPlaying(),

    getIsPlayRequested: (): boolean => orchestrationDispatchState.getIsPlayRequested(),

    resetWatcher: (): void => {
      rateLimitsBootstrapState.clear();
      rateLimitsState.clear();
      orchestrationEventsState.removeAllListeners();
    },

    resetDispatchState: (): void => {
      orchestrationDispatchState.clear();
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

    // Two publishers reach this bus — the file watcher and the guardrail's own ledger reading — so
    // a raw call count says nothing about which one fired. Collecting the events keeps each one's
    // processId, which is the only thing that separates them.
    collectRateLimitsUpdated: (): {
      eventsFrom: ({ processId }: { processId: string }) => readonly {
        processId: unknown;
        payload: unknown;
      }[];
    } => {
      const events: { processId: unknown; payload: unknown }[] = [];

      orchestrationEventsState.on({
        type: 'rate-limits-updated',
        handler: (event: { processId: unknown; payload: unknown }): void => {
          events.push(event);
        },
      });

      return {
        eventsFrom: ({
          processId,
        }: {
          processId: string;
        }): readonly { processId: unknown; payload: unknown }[] =>
          events.filter((event) => event.processId === processId),
      };
    },

    captureStderr: (): {
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
        hasLineWithSubstring: ({ substring }: { substring: string }): boolean =>
          lines.some((line) => String(line).includes(substring)),
        restore: (): void => {
          process.stderr.write = original;
        },
      };
    },
  };

  return {
    ...core,

    begin: ({ name }: { name: BaseName }): { tempDir: GuildPath; end: () => Promise<void> } => {
      const testbed = installTestbedCreateBroker({ baseName: name });
      const tempDir = testbed.guildPath;

      const savedHome = process.env.DUNGEONMASTER_HOME;
      const savedPollMs = process.env.DUNGEONMASTER_RATE_LIMITS_POLL_MS;
      // RateLimitsBootstrapResponder reads the cadence once, at the moment bootstrap() is called
      // and falls back to the 5s production one when it is unset — so the env has to be in place
      // before the test calls bootstrap(), which is why it rides begin() rather than a call a test
      // could forget.
      process.env.DUNGEONMASTER_HOME = tempDir;
      process.env.DUNGEONMASTER_RATE_LIMITS_POLL_MS = String(POLL_INTERVAL_MS);

      // An empty guild config, written rather than left absent. guildConfigReadBroker's ENOENT
      // branch turns on `cause instanceof Error`, and an error node's own fs raised outside jest's
      // vm realm fails that check — so a home with no config.json makes the play gate throw here
      // while it returns the default everywhere else.
      fs.writeFileSync(path.join(tempDir, GUILD_CONFIG_FILENAME), JSON.stringify({ guilds: [] }));

      // A ledger stamped NOW, so usageLedgerScanBroker takes its throttle path and returns what is
      // on disk. Without this the default ledger is stamped at the epoch, every guardrail pass
      // reads that as a measurement due, and the scan walks the DEVELOPER'S OWN ~/.claude/projects
      // — minutes of wall clock, and a reading no test wrote. `os.homedir()` cannot be redirected
      // from inside jest (its `process.env` is a copied object, so assigning HOME never reaches the
      // real environ libuv reads), so a fresh ledger is what keeps that tree out of the run.
      fs.writeFileSync(
        path.join(tempDir, USAGE_LEDGER_FILENAME),
        JSON.stringify({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
          updatedAt: new Date().toISOString(),
        }),
      );

      return {
        tempDir,
        end: async (): Promise<void> => {
          core.resetWatcher();
          // The last tick's pass is still in flight and still writing into this home; let it land
          // before the directory goes, or it recreates the home it is writing to.
          await core.awaitQuiet();
          core.resetDispatchState();
          if (savedHome === undefined) {
            Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
          } else {
            process.env.DUNGEONMASTER_HOME = savedHome;
          }
          if (savedPollMs === undefined) {
            Reflect.deleteProperty(process.env, 'DUNGEONMASTER_RATE_LIMITS_POLL_MS');
          } else {
            process.env.DUNGEONMASTER_RATE_LIMITS_POLL_MS = savedPollMs;
          }
          testbed.cleanup();
        },
      };
    },

    awaitHoldDetail: async ({
      tempDir,
      detail,
    }: {
      tempDir: GuildPath;
      detail: string;
    }): Promise<void> => {
      await core.pollUntil({
        condition: () => core.readDispatch({ tempDir }).hold?.detail === detail,
      });
      await core.awaitQuiet();
    },

    awaitHoldCleared: async ({ tempDir }: { tempDir: GuildPath }): Promise<void> => {
      await core.pollUntil({ condition: () => core.readDispatch({ tempDir }).hold === null });
      await core.awaitQuiet();
    },
  };
};
