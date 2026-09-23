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
 * // test.afterEach:  await dispatch.afterEach();   // pauses this spec's own loop within the turn
 * const { questId } = await dispatch.seedQuest({ guildId, title, userRequest, operations, firstWorkItemId });
 * await dispatch.playAndDrive({ questId, script: [{ role: 'codeweaver', outcome: 'done' }, ...] });
 * await dispatch.waitForQuest({ questId, predicate: ({ quest }) => quest.status === 'complete', timeoutMs: 20_000 });
 *
 * The pause BETWEEN specs is not this harness's job. `e2e-fixtures` pauses on both sides of every
 * test through an auto-fixture, so a spec that never imports this file cannot leak a running loop
 * into the next one. What `beforeEach` adds on top is the part no fixture can guess: it clears
 * both mock queues and drops a previous spec's `mcpHeartbeatAt`, leaving the dispatcher paused but
 * PLAYABLE.
 */

import * as fs from 'fs';
import * as path from 'path';

import type { APIRequestContext } from '@playwright/test';
import { z } from 'zod';

import type { FilePath, ProcessId, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import {
  SimpleTextResponseStub,
  WardQueueResponseStub,
  processIdContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import { dmHttpResponseContract } from '@dungeonmaster/hydration-recipes/contracts';
import type { DmHttpResponse } from '@dungeonmaster/hydration-recipes/contracts';

import { claudeMockHarness } from '../claude-mock/claude-mock.harness';
import { dispatchPauseHarness } from '../dispatch-pause/dispatch-pause.harness';
import { questHarness } from '../quest/quest.harness';
import { wardMockHarness } from '../ward-mock/ward-mock.harness';

const DISPATCH_STATE_ROUTE = '/api/orchestration/dispatch';
const DISPATCH_PLAYING_MODE = 'node-playing';

// The dispatch-state endpoint's body, narrowed to the one field a spec cares about.
const dispatchStateModeContract = z
  .object({ state: z.object({ mode: z.string().brand<'DispatchMode'>() }) })
  .transform((body) => body.state.mode);
const DISPATCH_PLAY_ROUTE = '/api/orchestration/dispatch/play';
const POLL_INTERVAL_MS = 100;
const DISPATCH_STATE_FILE = 'dispatch-state.json';

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
  agentCwd,
}: {
  request: APIRequestContext;
  guildPath: string;
  // The directory dispatched agents will really run in, when that is not the guild path — i.e. the
  // quest's worktree, once it is carved. See claudeMockHarness's own note: the fake CLI's queue is
  // scoped by the child's own cwd, so a spec driving a CARVED quest must say where that is or its
  // queued responses are invisible to the spawn.
  agentCwd?: string;
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
      // Seeds this scope its own work item (the first operation's comes from `firstWorkItemId`),
      // chained on the previous one so the relay dispatches the ledger serially. A scope with no
      // seeded item is left for `questAdvanceBroker` to enter at its family's ENTRY step.
      workItemId?: string;
      // The `agentFlowStatics` step that seeded work item carries. Omit it for a scope that runs no
      // step graph — its own `signal-back` completes the linked operation item directly and
      // `questAdvanceBroker` opens the next scope, with no `questRouteScopeBroker` route in between.
      step?: string;
    }[];
    firstWorkItemId: string;
    firstWorkItemStatus?: string;
    firstWorkItemSessionId?: string;
    // Seeds the quest as ALREADY CARVED — the state every role after riftcarver runs in. Its
    // sessions run in the worktree, so their JSONL lands under the worktree's path encoding and
    // the server has to resolve their tails through this field rather than the guild path.
    worktreePath?: string;
  }) => Promise<{ questId: QuestId; questFolder: QuestId; questFilePath: FilePath }>;
  queueScript: (params: {
    script: {
      role: string;
      outcome: 'done' | 'green' | 'red';
      // The assistant text this step's agent emits. Give two steps DIFFERENT text and a spec can
      // tell one role's transcript from the next one's — which is what an assertion about a role
      // TRANSITION needs, and what the shared default text cannot express.
      text?: string;
      // A green/red step only: the stdout lines the fake ward CLI writes before its `run: <id>`
      // line, for a spec asserting those lines reach the execution panel. Ignored on `done` — an
      // agent outcome has no ward stdout to carry it.
      outputLines?: string[];
    }[];
    agentLineDelayMs?: number;
  }) => void;
  playAndDrive: (params: {
    questId: string;
    script: {
      role: string;
      outcome: 'done' | 'green' | 'red';
      text?: string;
      outputLines?: string[];
    }[];
    agentLineDelayMs?: number;
  }) => Promise<void>;
  holdQueueWithMcpHeartbeat: () => void;
  isDispatchPlaying: () => Promise<boolean>;
  // Every fake-CLI spawn this spec caused, oldest first — carries the `--resume <sessionId>` the
  // orchestrator passed (null on a fresh spawn) and the verbatim prompt it dispatched.
  readClaudeInvocations: () => ReturnType<ReturnType<typeof claudeMockHarness>['readInvocations']>;
  waitForQuest: (params: {
    questId: string;
    predicate: (params: { quest: Quest }) => boolean;
    timeoutMs: number;
  }) => Promise<Quest>;
  // Plays the dispatcher directly, with no quest seeded and no script queued — for a spec that
  // measures the leak between specs rather than driving a real relay. See its own body for why
  // this is RAW ON PURPOSE.
  forcePlayDispatcher: () => Promise<{ status: DmHttpResponse['status'] }>;
  // Calls the real POST /api/quests/:questId/start route — the same one the Begin Quest button
  // calls — and hands back its status code plus the processId the body carries, since a caller
  // that polls `/api/process/:processId` next needs that id and no ingredient exposes it. See its
  // own body for why this is RAW ON PURPOSE.
  startQuestViaStartRoute: (params: {
    questId: string;
  }) => Promise<{ status: DmHttpResponse['status']; processId: ProcessId }>;
} => {
  const claudeMock = claudeMockHarness({
    guildPath,
    ...(agentCwd === undefined ? {} : { agentCwd }),
  });
  const wardMock = wardMockHarness({ guildPath });
  const quests = questHarness({ request });
  const { pause } = dispatchPauseHarness({ request });

  // Drops any `mcpHeartbeatAt` a previous spec's queue hold left behind, leaving the dispatcher
  // paused but PLAYABLE.
  const releaseQueueHold = (): void => {
    const home = process.env.DUNGEONMASTER_HOME;
    if (home === undefined) {
      throw new Error('DUNGEONMASTER_HOME env var is not set');
    }

    fs.writeFileSync(
      path.join(home, DISPATCH_STATE_FILE),
      JSON.stringify({ mode: 'paused', updatedAt: new Date().toISOString() }),
    );
  };

  // Split the script FIFO into the claude queue (an agent session, which signals `done` and
  // nothing else) and the ward queue (an exit code: green/red). The relay dispatches ONE work item
  // at a time, so FIFO order maps each outcome to the matching dispatch.
  //
  // `done` IS THE ONLY AGENT OUTCOME A QUEUED RESPONSE CAN SPELL, because `signal-back` carries no
  // outcome word: the four words ride on `quest-work`, which this fake CLI has no MCP client to
  // call. A ward outcome is spelled through the ward queue instead (green/red below): a red routes
  // `unmet` to a `repair` work item on the same scope, and the router returns that repair to a
  // fresh ward on its own `done`.
  const queueScript = ({
    script,
    agentLineDelayMs,
  }: {
    script: {
      role: string;
      outcome: 'done' | 'green' | 'red';
      text?: string;
      outputLines?: string[];
    }[];
    // Milliseconds the fake CLI waits between the stream lines it emits, which is what decides
    // how long its work item reads `in_progress`. At the 10 ms default a whole dispatch —
    // spawn, three lines, signal-back — lands inside ~30 ms, so a spec asserting that a row is
    // RUNNING is asserting against a window narrower than one WS round trip and one React
    // paint. A spec that asserts the running state buys a real one with this.
    agentLineDelayMs?: number;
  }): void => {
    for (const step of script) {
      if (step.outcome === 'done') {
        claudeMock.queueResponse({
          response: SimpleTextResponseStub({
            sessionId: `e2e-dispatch-session-${nextUnique()}`,
            signalBack: true,
            ...(agentLineDelayMs === undefined ? {} : { delayMs: agentLineDelayMs }),
            ...(step.text === undefined ? {} : { text: step.text }),
          }),
        });
      } else {
        // Root queue: the ward step (`stepHandlerWardBroker`, dispatched through `run-step`)
        // resolves cwd via `questCwdResolveBroker` and spawns the fake ward there — the quest's own
        // WORKTREE path, not the guild path — so the cwd-scoped queue never matches and the fake
        // ward falls back to this root queue.
        wardMock.queueRootResponse({
          response: WardQueueResponseStub({
            exitCode: step.outcome === 'green' ? 0 : 1,
            runId: `e2e-dispatch-ward-${nextUnique()}`,
            wardResultJson: { checks: [] },
            ...(step.outputLines === undefined ? {} : { outputLines: step.outputLines }),
          }),
        });
      }
    }
  };

  return {
    // Clear both queues + pause the shared runner. ONE runner scans every active quest on each wake,
    // so a leftover playing loop from a prior test would consume this test's queued responses.
    //
    // The MCP heartbeat is cleared for the mirror-image reason. `holdQueueWithMcpHeartbeat` writes
    // it into `dispatch-state.json`, which is ONE file shared by every spec in the run, and the
    // heartbeat stays fresh for its whole TTL — so a hold taken by a spec that wants the queue shut
    // would go on refusing the play for the next spec that wants it open. Every spec that drives the
    // queue calls this hook, so clearing it here is what keeps the two kinds of spec from
    // contradicting each other.
    beforeEach: async (): Promise<void> => {
      claudeMock.clearQueue();
      wardMock.clearQueue();
      releaseQueueHold();
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
      worktreePath,
    }) => {
      const created = await quests.createQuest({ guildId, title, userRequest });
      await quests.seedInProgressWithOperations({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        title,
        operations,
        firstWorkItemId,
        ...(firstWorkItemStatus === undefined ? {} : { firstWorkItemStatus }),
        ...(firstWorkItemSessionId === undefined ? {} : { firstWorkItemSessionId }),
        ...(worktreePath === undefined ? {} : { worktreePath }),
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
    playAndDrive: async ({ script, agentLineDelayMs }) => {
      queueScript({ script, ...(agentLineDelayMs === undefined ? {} : { agentLineDelayMs }) });

      // force: true overrides the play gate for e2e (no MCP heartbeat, no in-flight Task agent).
      await request.post(DISPATCH_PLAY_ROUTE, { data: { force: true } });
    },
    // Writes a FRESH MCP heartbeat into dispatch-state.json, which is the production signal that a
    // `/dumpster-launch` loop already owns the queue. `dispatchStatePlayGateBroker` refuses to play
    // while that heartbeat is fresh, so every UNFORCED play — including the one `POST /start` now
    // makes on the user's behalf — is declined and the dispatcher provably never wakes.
    //
    // Reach for this in a spec that is about what an endpoint WRITES rather than about what the
    // queue then does with it. Pausing after the fact cannot do that job: the enqueue happens
    // inside the start request, so the loop can pick the quest up before any later pause lands, and
    // the spec's own assertions then race a real carve. `playAndDrive` passes `force: true`, which
    // skips the gate — so a spec can still drive the queue deliberately after taking this hold.
    holdQueueWithMcpHeartbeat: (): void => {
      const home = process.env.DUNGEONMASTER_HOME;
      if (home === undefined) {
        throw new Error('DUNGEONMASTER_HOME env var is not set');
      }

      fs.writeFileSync(
        path.join(home, DISPATCH_STATE_FILE),
        JSON.stringify({
          mode: 'paused',
          mcpHeartbeatAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
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
    // RAW ON PURPOSE — no domain record models "the dispatcher is playing": it is a live
    // orchestration toggle, not a guild/quest/session/operation row, so no dmRegistryBroker
    // ingredient carries a verb for it (the same gap `dispatchPauseHarness.pause` already
    // documents for the pause route's own construction site). Reaches the play route directly,
    // the same force:true POST `playAndDrive` makes internally, standalone — for a spec that
    // plays the dispatcher with no quest seeded at all and needs the raw response status back.
    forcePlayDispatcher: async (): Promise<{ status: DmHttpResponse['status'] }> => {
      const response = await request.post(DISPATCH_PLAY_ROUTE, { data: { force: true } });
      return { status: dmHttpResponseContract.shape.status.parse(response.status()) };
    },
    // RAW ON PURPOSE — the quest ingredient's `transitions.reach` (questReachRouteBroker in
    // @dungeonmaster/hydration-recipes) CAN walk a quest to `in_progress` through this exact
    // production route, via `.set({ status: 'in_progress' })` on an api target — but its own
    // dmHttpResponseUnwrapAdapter discards the real HTTP status on success, returning only the
    // parsed body ("Returns ... the parsed body on a success status ... or throws ... otherwise").
    // A caller that needs the LITERAL status code back, not just success/failure, has no route
    // through the framework for it, so this calls the same production endpoint directly.
    startQuestViaStartRoute: async ({
      questId,
    }: {
      questId: string;
    }): Promise<{ status: DmHttpResponse['status']; processId: ProcessId }> => {
      const response = await request.post(`/api/quests/${questId}/start`);
      const body: unknown = await response.json();
      return {
        status: dmHttpResponseContract.shape.status.parse(response.status()),
        processId: processIdContract.parse((body as Record<PropertyKey, unknown>).processId),
      };
    },
  };
};
