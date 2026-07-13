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

import type { FilePath, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import {
  SimpleTextResponseStub,
  WardQueueResponseStub,
  questContract,
} from '@dungeonmaster/shared/contracts';

import { claudeMockHarness } from '../claude-mock/claude-mock.harness';
import { questHarness } from '../quest/quest.harness';
import { wardMockHarness } from '../ward-mock/ward-mock.harness';

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
  }) => Promise<{ questId: QuestId; questFolder: QuestId; questFilePath: FilePath }>;
  playAndDrive: (params: {
    questId: string;
    script: { role: string; outcome: 'done' | 'partial' | 'green' | 'red' }[];
  }) => Promise<void>;
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
      });
      return {
        questId: created.questId,
        questFolder: created.questFolder,
        questFilePath: created.filePath,
      };
    },
    playAndDrive: async ({ script }) => {
      // Split the script FIFO into the claude queue (agent outcomes: done/partial) and the ward
      // queue (ward outcomes: green/red). The relay dispatches ONE work item at a time, so FIFO
      // order maps each outcome to the matching dispatch.
      for (const step of script) {
        if (step.outcome === 'done' || step.outcome === 'partial') {
          claudeMock.queueResponse({
            response: SimpleTextResponseStub({
              sessionId: `e2e-dispatch-session-${nextUnique()}`,
              signalBack: { operationStatus: step.outcome },
            }),
          });
        } else {
          // Root queue: run-ward spawns the fake ward with the server's cwd, not the guild path,
          // so the cwd-scoped queue never matches — the fake ward falls back to the root queue.
          wardMock.queueRootResponse({
            response: WardQueueResponseStub({
              exitCode: step.outcome === 'green' ? 0 : 1,
              runId: `e2e-dispatch-ward-${nextUnique()}`,
              wardResultJson: { checks: [] },
            }),
          });
        }
      }

      // force: true overrides the play gate for e2e (no MCP heartbeat, no in-flight Task agent).
      await request.post(DISPATCH_PLAY_ROUTE, { data: { force: true } });
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
