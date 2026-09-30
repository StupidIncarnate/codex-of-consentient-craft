/**
 * PURPOSE: Owns every on-disk and in-process piece a quest-outbox integration test needs — the
 * temporary dungeonmaster home the watcher resolves its path from, the `event-outbox.jsonl` lines a
 * quest persist would have appended, and the callback pair a watcher is started with. Reach for this
 * rather than writing any of it from a scenario file: an integration test may import no node builtin
 * at all, and the outbox path is composed INSIDE the broker from the home the env names, so a
 * scenario cannot compute it.
 *
 * USAGE:
 * const harness = questOutboxHarness();
 * const { homeDir, end } = harness.begin({ name: BaseNameStub({ value: 'outbox-second-watcher' }) });
 * const listener = harness.listener();
 * const { stop } = await questOutboxWatchBroker(listener.callbacks);
 * harness.appendQuestLine({ homeDir, questId: 'alpha' });
 * await harness.awaitQuestIds({ listener, count: 1 });
 * stop();
 * await end();
 */
import { setTimeout } from '#gateway/node/setTimeout';
import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';
import * as fs from '#gateway/node/fs';
import * as path from '#gateway/node/path';

import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { QuestOutboxLineStub } from '../../../src/contracts/quest-outbox-line/quest-outbox-line.stub';

type BaseName = string;

const OUTBOX_FILENAME = 'event-outbox.jsonl';

// A deadline, not a sleep — awaitQuestIds resolves the instant the count arrives, so this costs
// wall clock only when a line genuinely never reaches the listener.
const POLL_TIMEOUT_MS = 8000;
const POLL_STEP_MS = 20;
// inotify delivery plus a readline drain. Long enough that "nothing further arrived" means
// something, short enough to pay for several times in one suite.
const QUIET_WINDOW_MS = 300;

export const questOutboxHarness = (): {
  begin: ({ name }: { name: BaseName }) => { homeDir: string; end: () => Promise<void> };
  appendQuestLine: ({ homeDir, questId }: { homeDir: string; questId: Quest['id'] }) => void;
  readOutboxQuestIds: ({ homeDir }: { homeDir: string }) => readonly Quest['id'][];
  outboxExists: ({ homeDir }: { homeDir: string }) => boolean;
  removeOutbox: ({ homeDir }: { homeDir: string }) => void;
  listener: () => {
    callbacks: {
      onQuestChanged: (args: { questId: Quest['id'] }) => void;
      onError: (args: { error: unknown }) => void;
    };
    questIds: () => readonly Quest['id'][];
    errors: () => readonly unknown[];
  };
  awaitQuestIds: ({
    listener,
    count,
  }: {
    listener: { questIds: () => readonly Quest['id'][] };
    count: number;
  }) => Promise<void>;
  awaitQuiet: () => Promise<void>;
} => ({
  begin: ({ name }: { name: BaseName }): { homeDir: string; end: () => Promise<void> } => {
    const testbed = installTestbedCreateBroker({ baseName: name });
    const homeDir = testbed.guildPath;

    const savedHome = getEnv('DUNGEONMASTER_HOME');
    setEnv('DUNGEONMASTER_HOME', homeDir);

    fs.mkdirSync(homeDir, { recursive: true });

    return {
      homeDir,
      end: async (): Promise<void> => {
        // Let any tail still draining land before the directory goes, or its readline hits a path
        // that has just been removed and reports an error no test asked about.
        await new Promise<void>((resolve) => {
          setTimeout(resolve, QUIET_WINDOW_MS);
        });
        if (savedHome === undefined) {
          deleteEnv('DUNGEONMASTER_HOME');
        } else {
          setEnv('DUNGEONMASTER_HOME', savedHome);
        }
        testbed.cleanup();
      },
    };
  },

  // The exact shape questOutboxAppendBroker writes on every quest persist — one JSON object per
  // line, newline-terminated.
  appendQuestLine: ({ homeDir, questId }: { homeDir: string; questId: Quest['id'] }): void => {
    const line = QuestOutboxLineStub({ questId, timestamp: new Date().toISOString() as never });
    fs.appendFileSync(path.join(homeDir, OUTBOX_FILENAME), `${JSON.stringify(line)}\n`);
  },

  // Each line goes back through the outbox-line stub, so a line the contract no longer accepts
  // fails here rather than comparing equal to an expectation as raw text.
  readOutboxQuestIds: ({ homeDir }: { homeDir: string }): readonly Quest['id'][] => {
    const raw = fs.readFileSync(path.join(homeDir, OUTBOX_FILENAME));
    return raw
      .split('\n')
      .filter((line) => line.length > 0)
      .map(
        (line) =>
          QuestOutboxLineStub(JSON.parse(line) as Parameters<typeof QuestOutboxLineStub>[0])
            .questId,
      );
  },

  outboxExists: ({ homeDir }: { homeDir: string }): boolean =>
    fs.existsSync(path.join(homeDir, OUTBOX_FILENAME)),

  removeOutbox: ({ homeDir }: { homeDir: string }): void => {
    fs.rmSync(path.join(homeDir, OUTBOX_FILENAME), { force: true });
  },

  // The callback pair a watcher is started with, plus the record of what reached it. A scenario
  // file may declare no function of its own, so the collecting closures live here.
  listener: (): {
    callbacks: {
      onQuestChanged: (args: { questId: Quest['id'] }) => void;
      onError: (args: { error: unknown }) => void;
    };
    questIds: () => readonly Quest['id'][];
    errors: () => readonly unknown[];
  } => {
    const received: Quest['id'][] = [];
    const seenErrors: unknown[] = [];

    return {
      callbacks: {
        onQuestChanged: ({ questId }: { questId: Quest['id'] }): void => {
          received.push(questId);
        },
        onError: ({ error }: { error: unknown }): void => {
          seenErrors.push(error);
        },
      },
      questIds: (): readonly Quest['id'][] => [...received],
      errors: (): readonly unknown[] => [...seenErrors],
    };
  },

  awaitQuestIds: async ({
    listener,
    count,
  }: {
    listener: { questIds: () => readonly Quest['id'][] };
    count: number;
  }): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const start = Date.now();
      const tick = (): void => {
        if (listener.questIds().length >= count) {
          resolve();
          return;
        }
        if (Date.now() - start >= POLL_TIMEOUT_MS) {
          reject(
            new Error(
              `awaitQuestIds timed out after ${String(POLL_TIMEOUT_MS)}ms: wanted ${String(count)}, got ${JSON.stringify(listener.questIds())}`,
            ),
          );
          return;
        }
        setTimeout(tick, POLL_STEP_MS);
      };
      tick();
    }),

  awaitQuiet: async (): Promise<void> =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, QUIET_WINDOW_MS);
    }),
});
