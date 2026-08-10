/**
 * PURPOSE: Composes the claude + ward mock queues, quest seeding, and a deadline-bounded quest
 * poller into ONE harness that deterministically drives the operations-ledger relay via the Node
 * dispatcher. `playAndDrive` splits a FIFO script into the two mock queues then POSTs
 * dispatch/play; the relay dispatches serially (one work item at a time) so FIFO ordering maps
 * outcomes to dispatches. The fake Claude CLI signals back over the env-gated HTTP endpoint before
 * exiting, and ward items run in-process off the fake-ward exit code.
 *
 * USAGE:
 * const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
 * // test.beforeEach: await dispatch.beforeEach();  // clears both queues + pauses the shared runner
 * // test.afterEach:  await dispatch.afterEach();   // pauses so a leftover loop never eats the next spec's queue
 * const { questId } = await dispatch.seedQuest({ guildId, title, userRequest, operations, firstWorkItemId });
 * await dispatch.playAndDrive({ questId, script: [{ role: 'codeweaver', outcome: 'done' }, ...] });
 * await dispatch.waitForQuest({ questId, predicate: ({ quest }) => quest.status === 'complete', timeoutMs: 20_000 });
 */

import type { APIRequestContext } from '@playwright/test';
import { z } from 'zod';

import type { FilePath, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import {
  SimpleTextResponseStub,
  WardQueueResponseStub,
  questContract,
} from '@dungeonmaster/shared/contracts';

import { claudeMockHarness } from '../claude-mock/claude-mock.harness';
import { questHarness } from '../quest/quest.harness';
import { wardMockHarness } from '../ward-mock/ward-mock.harness';

const DISPATCH_STATE_ROUTE = '/api/orchestration/dispatch';
const DISPATCH_PLAYING_MODE = 'node-playing';

// The dispatch-state endpoint's body, narrowed to the one field a spec cares about.
const dispatchStateModeContract = z
  .object({ state: z.object({ mode: z.string().brand<'DispatchMode'>() }) })
  .transform((body) => body.state.mode);
const DISPATCH_PLAY_ROUTE = '/api/orchestration/dispatch/play';
const DISPATCH_PAUSE_ROUTE = '/api/orchestration/dispatch/pause';
const POLL_INTERVAL_MS = 100;

// Module-scoped monotonic counter → every queued response gets a globally-unique, incrementing
// sessionId/runId. A shared constant would collide sessionId-keyed server state across dispatches.
let uniqueCounter = 0;
const nextUnique = () => {
  uniqueCounter += 1;
  return uniqueCounter;
};

export const dispatchHarness = ({
  request,
  guildPath,
}: {
  request: APIRequestContext;
  guildPath: string;
}): {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  seedQuest: (params: {
    guildId: string;
    title: string;
    userRequest: string;
    operations: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
    }[];
    firstWorkItemId: string;
    firstWorkItemStatus?: string;
    firstWorkItemSessionId?: string;
    // Seeds the quest's runtime flow with the Flowrider track's sign-offs already written — the
    // state a real flowrider session reaches before it signals. Required whenever the ledger
    // carries a `flowrider` item this spec drives to `done`, because signal-back recomputes that
    // scope and refuses `done` while any verification unit on it is unsigned.
    flowriderScopeSignedOff?: boolean;
  }) => Promise<{ questId: QuestId; questFolder: QuestId; questFilePath: FilePath }>;
  queueScript: (params: {
    script: { role: string; outcome: 'done' | 'partial' | 'green' | 'red' }[];
    agentLineDelayMs?: number;
  }) => void;
  playAndDrive: (params: {
    questId: string;
    script: { role: string; outcome: 'done' | 'partial' | 'green' | 'red' }[];
  }) => Promise<void>;
  isDispatchPlaying: () => Promise<boolean>;
  // Every fake-CLI spawn this spec caused, oldest first — carries the `--resume <sessionId>` the
  // orchestrator passed (null on a fresh spawn) and the verbatim prompt it dispatched.
  readClaudeInvocations: () => ReturnType<ReturnType<typeof claudeMockHarness>['readInvocations']>;
  waitForQuest: (params: {
    questId: string;
    predicate: (params: { quest: Quest }) => boolean;
    timeoutMs: number;
  }) => Promise<Quest>;
} => {
  const claudeMock = claudeMockHarness({ guildPath });
  const wardMock = wardMockHarness({ guildPath });
  const quests = questHarness({ request });

  const pause = async (): Promise<void> => {
    await request.post(DISPATCH_PAUSE_ROUTE);
  };

  // Split the script FIFO into the claude queue (agent outcomes: done/partial) and the ward queue
  // (ward outcomes: green/red). The relay dispatches ONE work item at a time, so FIFO order maps
  // each outcome to the matching dispatch.
  const queueScript = ({
    script,
    agentLineDelayMs,
  }: {
    script: { role: string; outcome: 'done' | 'partial' | 'green' | 'red' }[];
    // Milliseconds the fake CLI waits between the stream lines it emits, which is what decides
    // how long its work item reads `in_progress`. At the 10 ms default a whole dispatch —
    // spawn, three lines, signal-back — lands inside ~30 ms, so a spec asserting that a row is
    // RUNNING is asserting against a window narrower than one WS round trip and one React
    // paint. A spec that asserts the running state buys a real one with this.
    agentLineDelayMs?: number;
  }): void => {
    for (const step of script) {
      if (step.outcome === 'done' || step.outcome === 'partial') {
        claudeMock.queueResponse({
          response: SimpleTextResponseStub({
            sessionId: `e2e-dispatch-session-${nextUnique()}`,
            signalBack: { operationStatus: step.outcome },
            ...(agentLineDelayMs === undefined ? {} : { delayMs: agentLineDelayMs }),
          }),
        });
      } else {
        // Root queue: run-ward spawns the fake ward with the server's cwd, not the guild path, so
        // the cwd-scoped queue never matches — the fake ward falls back to the root queue.
        wardMock.queueRootResponse({
          response: WardQueueResponseStub({
            exitCode: step.outcome === 'green' ? 0 : 1,
            runId: `e2e-dispatch-ward-${nextUnique()}`,
            wardResultJson: { checks: [] },
          }),
        });
      }
    }
  };

  return {
    // Clear both queues + pause the shared runner. ONE runner scans every active quest on each wake,
    // so a leftover playing loop from a prior test would consume this test's queued responses.
    beforeEach: async (): Promise<void> => {
      claudeMock.clearQueue();
      wardMock.clearQueue();
      await pause();
    },
    afterEach: pause,
    seedQuest: async ({
      guildId,
      title,
      userRequest,
      operations,
      firstWorkItemId,
      firstWorkItemStatus,
      firstWorkItemSessionId,
      flowriderScopeSignedOff,
    }) => {
      const created = await quests.createQuest({ guildId, title, userRequest });
      quests.seedInProgressWithOperations({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        title,
        operations,
        firstWorkItemId,
        ...(firstWorkItemStatus === undefined ? {} : { firstWorkItemStatus }),
        ...(firstWorkItemSessionId === undefined ? {} : { firstWorkItemSessionId }),
        ...(flowriderScopeSignedOff === undefined ? {} : { flowriderScopeSignedOff }),
      });
      return {
        questId: created.questId,
        questFolder: created.questFolder,
        questFilePath: created.filePath,
      };
    },
    // Load the mock queues WITHOUT playing — for specs where something other than an explicit
    // play starts the dispatcher (resuming a quest does), so the agent it spawns still finds a
    // queued outcome instead of exiting red-on-empty and churning orphan recovery.
    queueScript,
    readClaudeInvocations: claudeMock.readInvocations,
    playAndDrive: async ({ script }) => {
      queueScript({ script });

      // force: true overrides the play gate for e2e (no MCP heartbeat, no in-flight Task agent).
      await request.post(DISPATCH_PLAY_ROUTE, { data: { force: true } });
    },
    // True when the Node dispatcher is actively driving the queue. Read back from the server
    // rather than trusted from a response body, so a spec can prove the switch really flipped.
    isDispatchPlaying: async (): Promise<boolean> => {
      const response = await request.get(DISPATCH_STATE_ROUTE);
      const raw: unknown = await response.json();
      return dispatchStateModeContract.parse(raw) === DISPATCH_PLAYING_MODE;
    },
    waitForQuest: async ({ questId, predicate, timeoutMs }) => {
      const deadline = Date.now() + timeoutMs;
      const poll = async (): Promise<Quest> => {
        const response = await request.get(`/api/quests/${questId}`);
        const raw: unknown = await response.json();
        const body = raw as Record<PropertyKey, unknown>;
        const quest = questContract.parse(body.quest);
        if (predicate({ quest })) {
          return quest;
        }
        if (Date.now() >= deadline) {
          throw new Error(
            `waitForQuest timed out after ${timeoutMs}ms for quest ${questId}. Operations: ${JSON.stringify(
              quest.operations.map((op) => ({ role: op.role, status: op.status })),
            )}; workItems: ${JSON.stringify(
              quest.workItems.map((wi) => ({ role: wi.role, status: wi.status })),
            )}; questStatus: ${quest.status}`,
          );
        }
        await new Promise<void>((resolve) => {
          setTimeout(resolve, POLL_INTERVAL_MS);
        });
        return poll();
      };
      return poll();
    },
  };
};
