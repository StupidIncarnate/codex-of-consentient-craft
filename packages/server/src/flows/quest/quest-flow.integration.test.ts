import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestCommentStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/quests', () => {
    it('VALID: {missing guildId} => delegates to QuestListResponder which validates and returns 400', async () => {
      const app = QuestFlow();

      const response = await app.request('/api/quests');
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'guildId query parameter is required' });
    });
  });

  describe('GET /api/quests/:questId', () => {
    it('VALID: {questId with no quest on disk} => delegates to QuestGetResponder and returns 404', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}`);

      expect(response.status).toBe(404);
    });
  });

  // Flow: comments-excluded-from-agent-reads, node web-read-keeps-comments, observable
  // check-http-get-returns-comments. The server never strips anything from QuestGetResponder's
  // output — only the MCP get-quest tool does that (packages/mcp only). Driving a real HTTP
  // request through the real Hono router against a real quest.json on disk proves the browser's
  // GET keeps the comments array the agent read is denied.
  //
  // Two comments, not one: a single-comment fixture cannot tell "the whole array survived" from
  // "only the first element survived" (an off-by-index/truncation regression reads identical to
  // correct behavior when there is nothing after index 0). The two comments also differ in anchor
  // shape — one bare-node, one carrying observableId — so a regression that drops or defaults
  // observableId on the wire is not masked by every fixture comment sharing the same anchor shape.
  describe('GET /api/quests/:questId with comments', () => {
    it('VALID: {quest carrying two comments — one bare-node-anchored, one observable-anchored} => the JSON response includes the full comments array unchanged, anchors intact', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-get' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [
          FlowNodeStub({ id: 'start' as never, label: 'Start' as never }),
          FlowNodeStub({ id: 'end' as never, label: 'End' as never }),
        ],
        edges: [],
      });
      const bareComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d901' as never,
        flowId: 'login-flow' as never,
        nodeId: 'start' as never,
        text: 'Visible to the browser, never to an agent' as never,
      });
      const observableComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d902' as never,
        flowId: 'login-flow' as never,
        nodeId: 'end' as never,
        observableId: 'login-redirects-to-dashboard' as never,
        text: 'Anchored to an observable, must survive same as the bare-node comment' as never,
      });
      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [bareComment, observableComment],
        },
      });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${quest.id}`);
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        success: true,
        quest: harness.toPlain(quest),
      });
    });
  });

  describe('GET /api/quests/:questId/ward-results/:wardResultId', () => {
    it('VALID: {questId without matching quest} => delegates to QuestWardDetailResponder and returns 404', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();
      const wardResultId = '22222222-2222-4222-8222-222222222222';

      const response = await app.request(`/api/quests/${questId}/ward-results/${wardResultId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/quests/:questId/riftcarver-results/:riftcarverResultId', () => {
    it('VALID: {questId without matching quest} => delegates to QuestRiftcarverDetailResponder and returns 404', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();
      const riftcarverResultId = '22222222-2222-4222-8222-222222222222';

      const response = await app.request(
        `/api/quests/${questId}/riftcarver-results/${riftcarverResultId}`,
      );

      expect(response.status).toBe(404);
    });
  });

  // The summary is COMPUTED from the persisted flow graph, not stored — so the only way to prove
  // the route returns real numbers (rather than an empty envelope that happens to be 200) is to
  // drive a real HTTP request against a real quest.json whose graph the counts can be derived from
  // by hand. The seeded flow is deliberately mixed: a Siegemaster-added observable (which
  // Codeweaver's and Flowrider's denominators both exclude, so it must be absent from their two
  // numbers and present in midQuestObservables), a terminal, a labelled branch, and one note of
  // each of two kinds.
  describe('GET /api/quests/:questId/summary', () => {
    it('VALID: {quest with a terminal, a labelled branch, a siegemaster-added observable and two notes} => 200 carrying per-track outstanding counts, the drift row and every note group', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-summary-get' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const openQuestionNote = QuestNoteStub({
        id: 'open-question-anchor-scope',
        kind: 'open-question',
      });
      const toolingErrorNote = QuestNoteStub({
        id: 'tooling-error-ward-oom',
        kind: 'tooling-error',
      });

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login Page' as never,
            observables: [
              FlowObservableStub({
                id: 'crash-on-bleh' as never,
                type: 'api-call' as never,
                description: 'POST /api/auth/login returns 400 for a non-JSON body' as never,
                addedBy: 'siegemaster' as never,
              }),
            ],
          }),
          FlowNodeStub({
            id: 'dashboard' as never,
            label: 'Dashboard' as never,
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-success' as never,
            from: 'login-page' as never,
            to: 'dashboard' as never,
            label: 'success' as never,
          }),
        ],
      });
      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'in_progress' as never,
          flows: [flow],
          planningNotes: {
            blightLedger: [],
            questNotes: [openQuestionNote, toolingErrorNote],
            operationPlans: [],
          },
        },
      });
      const questId = quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/summary`);
      const body: unknown = await response.json();

      restore();

      // login-flow is runtime, so all three denominators measure it. Units: 1 terminal (dashboard,
      // the only node with no outgoing edge) + 1 labelled branch (e-success) + 1 observable + 7
      // off-map families. Codeweaver and Flowrider both shed the off-map families AND the
      // siegemaster-added observable, leaving terminal + branch each — 2 outstanding apiece.
      // Siegemaster keeps all 10 as outstanding. No work item marked anything, so `met`, `cantMeet`
      // and `unmet` are always 0 on every track, and the whole-quest `debt` list below is always [].
      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        questId,
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            tracks: [
              { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
              { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
              { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 10 },
            ],
          },
        ],
        midQuestObservables: [
          {
            id: 'login-flow:observable:crash-on-bleh',
            flowId: 'login-flow',
            nodeId: 'login-page',
            observableId: 'crash-on-bleh',
            addedBy: 'siegemaster',
            observableType: 'api-call',
            description: 'POST /api/auth/login returns 400 for a non-JSON body',
          },
        ],
        debt: [],
        noteGroups: [
          { id: 'open-question', notes: [harness.toPlain(openQuestionNote)] },
          { id: 'tooling-error', notes: [harness.toPlain(toolingErrorNote)] },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
          { id: 'walked', notes: [] },
          { id: 'human-verdict', notes: [] },
        ],
      });
    });

    // A REAL guilds tree holding a REAL other quest, so the 404 proves "this quest is in no guild"
    // rather than "the home dir does not exist" — those are different failures and only the first
    // one is what a browser asking for a deleted quest actually hits.
    it('VALID: {questId absent from a populated guilds tree} => delegates to QuestSummaryResponder and returns 404 rather than an empty summary', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-summary-missing' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {},
      });

      const app = QuestFlow();
      const questId = QuestIdStub({ value: 'server-http-summary-gone' });

      const response = await app.request(`/api/quests/${questId}/summary`);
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(404);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest with id "server-http-summary-gone" not found in any guild',
      });
    });
  });

  // The projection is COMPUTED from the persisted operations/workItems ledger, not stored — so the
  // only way to prove the route returns real step names (rather than an empty envelope that happens
  // to be 200) is to drive a real HTTP request against a real quest.json seeded with a real scope
  // one step in, and read the real agentFlowStatics step keys back off the response.
  describe('GET /api/quests/:questId/projection', () => {
    it('VALID: {quest with a codeweaver scope one step in} => 200 carrying the actual step and the planned remainder, by real step name', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-projection-get' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const opId = OperationItemIdStub({ value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
      const planWorkItemId = QuestWorkItemIdStub({
        value: '11111111-1111-4111-8111-111111111111',
      });

      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'in_progress' as never,
          operations: [
            OperationItemStub({
              id: opId,
              role: 'codeweaver',
              text: 'core: config load+validate adapter',
              status: 'in_progress',
            }),
          ],
          workItems: [
            WorkItemStub({
              id: planWorkItemId,
              role: 'codeweaver',
              status: 'complete',
              step: 'plan',
              relatedDataItems: [`operations/${opId}`],
            }),
          ],
        },
      });
      const questId = quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/projection`);
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        questId,
        scopes: [
          {
            operationId: opId,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
            steps: [
              { step: 'plan', kind: 'actual', workItemId: planWorkItemId, status: 'complete' },
              { step: 'work', kind: 'planned' },
              { step: 'review', kind: 'planned' },
              { step: 'commit', kind: 'planned' },
              { step: 'ward', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 5,
        completedSteps: 1,
      });
    });

    it('EMPTY: {quest with no operations minted yet} => 200 carrying an empty scope list and zero counts', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-projection-empty' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: { operations: [], workItems: [] },
      });
      const questId = quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/projection`);
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        questId,
        scopes: [],
        totalPlannedSteps: 0,
        completedSteps: 0,
      });
    });

    // A REAL guilds tree holding a REAL other quest, so the 404 proves "this quest is in no guild"
    // rather than "the home dir does not exist" — mirrors the summary route's own unknown-quest case.
    it('VALID: {questId absent from a populated guilds tree} => delegates to QuestProjectionResponder and returns 404 rather than an empty projection', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-projection-missing' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {},
      });

      const app = QuestFlow();
      const questId = QuestIdStub({ value: 'server-http-projection-gone' });

      const response = await app.request(`/api/quests/${questId}/projection`);
      const body: unknown = await response.json();

      restore();

      expect(response.status).toBe(404);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest with id "server-http-projection-gone" not found in any guild',
      });
    });
  });

  describe('PATCH /api/quests/:questId', () => {
    it('VALID: {questId, body} => delegates to QuestModifyResponder and returns response', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/quests/:questId/start', () => {
    it('VALID: {questId without matching quest} => delegates to QuestStartResponder and returns 400 quest-not-found', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/start`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest not found',
      });
    });
  });

  describe('POST /api/quests/:questId/resume', () => {
    it('VALID: {questId without matching quest} => delegates to QuestResumeResponder and returns 400 quest-not-found', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/resume`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest not found',
      });
    });
  });

  describe('POST /api/quests/:questId/merge', () => {
    it('VALID: {questId without matching quest} => delegates to QuestMergeResponder and returns 400 quest-not-found', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/merge`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Quest not found',
      });
    });
  });

  describe('POST /api/quests/:questId/followup', () => {
    it('VALID: {questId without matching quest} => delegates to QuestFollowupResponder and returns 500 quest-not-found', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What happened here?' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(harness.toPlain(body)).toStrictEqual({
        error: `Quest with id "${questId}" not found in any guild`,
      });
    });

    // Mirrors the comments route's non-JSON-body test above and the signal-back route's below:
    // quest-flow.ts degrades a body that is not JSON at all to an empty object
    // (`.catch(() => ({}))`) so the responder's own validation produces the 400, rather than an
    // unhandled parse error escaping the route handler as Hono's generic, non-JSON
    // "Internal Server Error" 500.
    it('INVALID: {non-JSON body} => reaches the responder 400 rather than throwing out of the route', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json at all',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'message is required' });
    });
  });

  describe('POST /api/quests/:questId/followup/stop', () => {
    // Its own route rather than a flag on the followup POST above, and registered under a path
    // that nests below it — so this proves Hono routes the two distinctly rather than the parent
    // swallowing `/stop` as a questId. The MESSAGE is what pins which responder answered:
    // `Quest not found: <id>` is FollowupChatStopResponder's own wording, where the followup route
    // reaches the quest LOADER and reports `Quest with id "<id>" not found in any guild`. A
    // bodyless POST is the second half — that route would have answered 400 'message is required'.
    it('VALID: {bodyless POST, questId without matching quest} => reaches QuestFollowupStopResponder and returns its own 500', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/followup/stop`, {
        method: 'POST',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(harness.toPlain(body)).toStrictEqual({
        error: `Quest not found: ${questId}`,
      });
    });
  });

  describe('POST /api/quests/:questId/signal-back (env-gated)', () => {
    it('INVALID: {E2E_SIGNAL_BACK_HTTP=1, body missing workItemId} => 400 route registered, responder validates before the orchestrator call', async () => {
      process.env.E2E_SIGNAL_BACK_HTTP = '1';
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: 'complete' }),
      });
      const body: unknown = await response.json();

      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'Invalid signal-back input' });
    });

    // Mirrors the comments route's non-JSON-body test below: quest-flow.ts degrades a body that
    // is not JSON at all to an empty object (`.catch(() => ({}))`) so the responder's own
    // validation produces the 400, rather than an unhandled parse error escaping the route
    // handler. Same code shape as the comments route's catch; this proves the signal-back route's
    // own copy of it behaves identically instead of assuming it does by analogy.
    it('INVALID: {E2E_SIGNAL_BACK_HTTP=1, non-JSON body} => reaches the responder 400 rather than throwing out of the route', async () => {
      process.env.E2E_SIGNAL_BACK_HTTP = '1';
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json at all',
      });
      const body: unknown = await response.json();

      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({ error: 'Invalid signal-back input' });
    });

    it('VALID: {E2E_SIGNAL_BACK_HTTP=1, valid body, no matching quest} => 500 drives the real StartOrchestrator.handleSignalBack which surfaces the missing-quest error', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-signal-back' });
      process.env.E2E_SIGNAL_BACK_HTTP = '1';
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workItemId, signal: 'complete' }),
      });

      restore();
      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');

      expect(response.status).toBe(500);
    });

    it('VALID: {E2E_SIGNAL_BACK_HTTP unset} => 404 route not registered so production never exposes it', async () => {
      Reflect.deleteProperty(process.env, 'E2E_SIGNAL_BACK_HTTP');
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const app = QuestFlow();

      const response = await app.request(`/api/quests/${questId}/signal-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workItemId, signal: 'complete' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/quests/:questId/comments', () => {
    // Flow: send-queued-comment-batch, branch e2-body-invalid, observable check-empty-comments-400.
    // The observable's db-query half ("the quest comments array is unchanged") is only provable
    // against a quest that HAD a comment before the POST — a questId with nothing on disk cannot
    // discriminate "stayed the same" from "there was never anything to change".
    it('EMPTY: {comments: []} => delegates to QuestCommentBatchResponder, returns 400 empty-batch, and leaves the quest comments array untouched', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-empty-batch' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const existingComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d900' as never,
        flowId: 'login-flow' as never,
        nodeId: 'start' as never,
        text: 'Pre-existing comment that must survive a rejected empty batch' as never,
      });
      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [existingComment],
        },
      });
      const questId = quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: [] }),
      });
      const body: unknown = await response.json();
      const getAfter = await app.request(`/api/quests/${questId}`);
      const questAfter: unknown = await getAfter.json();

      restore();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'comments array is required and must not be empty',
      });
      expect(harness.toPlain(questAfter)).toStrictEqual({
        success: true,
        quest: harness.toPlain(quest),
      });
    });

    it('INVALID: {non-JSON body} => reaches the responder 400 rather than throwing out of the route', async () => {
      const app = QuestFlow();
      const questId = QuestIdStub();

      const response = await app.request(`/api/quests/${questId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json at all',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'comments array is required and must not be empty',
      });
    });

    // Flow: send-queued-comment-batch, branch e2-body-invalid, observable
    // check-malformed-entry-400. Same "must have had a comment to lose" reasoning as the
    // empty-batch test above — plus this proves the malformed-entry message is a DIFFERENT
    // string from the empty-batch message asserted in the test above (both are real HTTP
    // responses from the same route, not two paraphrases of the same status code).
    it('INVALID: {entry with a 300-char unbroken garbage token as flowId} => returns 400 naming the entry fields, distinct from the empty-batch message, and leaves the quest comments array untouched', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-malformed' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      // Uppercase leading character violates flowId's kebab-case regex; the rest pads it out
      // to an unbroken 300-char token — the fixture is both malformed AND hostile-length.
      const garbageFlowId = `X${'x'.repeat(299)}`;

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const existingComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d901' as never,
        flowId: 'login-flow' as never,
        nodeId: 'start' as never,
        text: 'Pre-existing comment that must survive a rejected malformed batch' as never,
      });
      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [existingComment],
        },
      });
      const questId = quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: [{ flowId: garbageFlowId, nodeId: 'start', text: 'This looks wrong' }],
        }),
      });
      const body: unknown = await response.json();
      const getAfter = await app.request(`/api/quests/${questId}`);
      const questAfter: unknown = await getAfter.json();

      restore();

      expect(response.status).toBe(400);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'Each comment must carry a valid flowId, nodeId and text',
      });
      expect(harness.toPlain(questAfter)).toStrictEqual({
        success: true,
        quest: harness.toPlain(quest),
      });
    });

    it('EDGE: {quest on disk carries no chaoswhisperer work item with a sessionId} => returns 404 and persists no comments', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-no-session' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'flows_approved' as never,
          flows: [flow],
          workItems: [],
        },
      });
      const questId = quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }],
        }),
      });
      const body: unknown = await response.json();
      const getAfter = await app.request(`/api/quests/${questId}`);
      const questAfter: unknown = await getAfter.json();

      restore();

      expect(response.status).toBe(404);
      expect(harness.toPlain(body)).toStrictEqual({
        error: 'No active chat session found for quest',
      });
      expect(harness.toPlain(questAfter)).toStrictEqual({
        success: true,
        quest: harness.toPlain(quest),
      });
    });

    // Flow: send-queued-comment-batch, node reject-stale-anchor, observables
    // check-deleted-node-409, check-409-lists-stale-anchors and check-stale-anchor-no-chat-turn.
    // B3 (browser) depends on the 409 body naming every offender and omitting every anchor that
    // still resolves — this is the contract that makes its selective-prune possible, driven
    // through the real Hono route against a real quest.json rather than a mocked orchestrator
    // adapter. The zero-spawn claim is proven against a REAL guild + REAL fake-Claude-CLI
    // environment (not "CLAUDE_CLI_PATH unset") and PAIRED against a follow-up valid batch that
    // reaches a genuine non-empty ledger in the very same environment — an unpaired zero-count
    // assertion cannot tell "correctly never spawned" from "the ledger path is wrong and would
    // read empty no matter what".
    //
    // Both exchanges run in beforeAll, and the PAIRING is why: they have to share one environment —
    // one guild, one quest, one fake-CLI queue directory, in that order — so they cannot be two
    // independent tests, and running both inside either one charges that test for the other's work.
    // The cost is real and irreducible: a 2s window this batch must produce no spawn inside, then a
    // wait on a spawn that genuinely happens. jest leaves a beforeAll outside the window it measures
    // a test in, so the two `it` blocks below read the outcome each one is named for.
    describe('a rejected batch beside an accepted one, in one environment', () => {
      let staleResponse: Response | undefined;
      let staleBody: unknown;
      let questAfterStale: unknown;
      let invocationAfterStale: unknown;
      let validResponse: Response | undefined;
      let invocationAfterValid: unknown;
      let seededQuest: ReturnType<typeof QuestStub> | undefined;
      let seededSessionId: ReturnType<typeof SessionIdStub> | undefined;

      beforeAll(async () => {
        const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-stale' });
        const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
        const cli = harness.configureFakeClaudeCli();

        const flow = FlowStub({
          id: 'login-flow' as never,
          nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
          edges: [],
        });
        seededSessionId = SessionIdStub({ value: 'bbbbbbbb-2222-4222-8222-444444444444' });
        // A REAL guild, registered through the guild ingredient's own `write` route
        // (StartOrchestrator.addGuild) — guildGetBroker (invoked deep inside chatSpawnBroker on
        // any path that reaches a resume) needs it in config.json.
        const seeded = await harness.seedGuildAndQuestFields({
          dungeonmasterHome,
          guildName: 'Stale Anchor Guild',
          guildPath: dungeonmasterHome,
          fields: {
            status: 'flows_approved' as never,
            flows: [flow],
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: 'aaaaaaaa-2222-4222-8222-444444444444' }),
                role: 'chaoswhisperer',
                status: 'in_progress',
                sessionId: seededSessionId,
              }),
            ],
          },
        });
        seededQuest = seeded.quest;
        const questId = seededQuest.id;

        const app = QuestFlow();
        staleResponse = await app.request(`/api/quests/${questId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comments: [
              { flowId: 'login-flow', nodeId: 'start', text: 'First on the live node' },
              // Duplicate anchor — same live node as the entry above, different text.
              { flowId: 'login-flow', nodeId: 'start', text: 'Second on the same live node' },
              { flowId: 'login-flow', nodeId: 'deleted-node', text: 'Third names a gone node' },
            ],
          }),
        });
        staleBody = await staleResponse.json();
        const getAfterStale = await app.request(`/api/quests/${questId}`);
        questAfterStale = await getAfterStale.json();

        // Bounded wait for a spawn this rejected batch must never produce.
        invocationAfterStale = await harness.waitForClaudeInvocation({
          claudeQueueDir: cli.claudeQueueDir,
          cwd: dungeonmasterHome,
          timeoutMs: 2000,
        });

        // Pair: the SAME environment, a batch whose lone anchor resolves, reaches a real spawn —
        // proving the empty ledger above is a genuine absence, not a selector that would read empty
        // regardless (a typo'd queue dir, an unregistered guild, a missing sessionId).
        validResponse = await app.request(`/api/quests/${questId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comments: [
              { flowId: 'login-flow', nodeId: 'start', text: 'A valid comment that really sends' },
            ],
          }),
        });
        invocationAfterValid = await harness.waitForClaudeInvocation({
          claudeQueueDir: cli.claudeQueueDir,
          cwd: dungeonmasterHome,
          timeoutMs: 8000,
        });

        cli.restore();
        restore();
      }, 30000);

      it('EDGE: {batch of 3 comments — two sharing one valid anchor, one naming a deleted node} => returns 409 naming only the stale anchor, persists no comments, and spawns ZERO real chat processes', () => {
        expect(staleResponse?.status).toBe(409);
        expect(harness.toPlain(staleBody)).toStrictEqual({
          error: 'Comment anchor no longer exists on the quest',
          staleAnchors: [{ flowId: 'login-flow', nodeId: 'deleted-node' }],
        });
        expect(harness.toPlain(questAfterStale)).toStrictEqual({
          success: true,
          quest: harness.toPlain(seededQuest),
        });
        expect(invocationAfterStale).toBe(null);
      });

      it('VALID: {a follow-up batch whose lone anchor resolves, in that same environment} => 200 and a genuine spawn, so the zero above is an absence rather than a broken ledger path', () => {
        expect(validResponse?.status).toBe(200);
        expect(invocationAfterValid).toStrictEqual({
          resumeSessionId: seededSessionId,
          prompt:
            'Flow "Login Flow" / node `start` ("Start")\nUser Comment: A valid comment that really sends',
        });
      });
    });

    // Flow: send-queued-comment-batch, node persist-comment-batch, observable
    // check-persist-failure-500. A mocked orchestrator adapter (see
    // quest-comment-batch-responder.test.ts) proves the RESPONDER's own 500-shaping logic given a
    // failure, but not that a REAL fs write failure reaches it as an actual HTTP exchange. Stripping
    // write permission from the quest's own directory forces `questPersistBroker`'s real atomic
    // temp-file-then-rename write to fail for real, so this is a genuine 500 driven through the
    // real Hono route. The suffix of the real fs error text is platform-dependent, so the assertion
    // pins the exact prefix CommentBatchResponder wraps every persist failure in (plus requiring a
    // non-empty suffix), and — via toStrictEqual on the whole body — that the body carries no OTHER
    // key (in particular, no chatProcessId).
    it('ERROR: {quest directory stripped of write permission after a valid quest+session are seeded} => POST returns 500 prefixed "Failed to persist comment batch: ", carrying no chatProcessId', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-persist-fail' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const quest = await harness.seedQuestFields({
        dungeonmasterHome,
        guildId,
        fields: {
          status: 'flows_approved' as never,
          flows: [flow],
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-4444-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId: SessionIdStub({ value: 'bbbbbbbb-4444-4222-8222-444444444444' }),
            }),
          ],
        },
      });
      const questId = quest.id;
      const readOnlyDir = harness.makeQuestDirectoryReadOnly({
        dungeonmasterHome,
        guildId,
        questFolder: quest.folder,
      });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }],
        }),
      });
      const body: unknown = await response.json();

      readOnlyDir.restore();
      restore();

      expect(response.status).toBe(500);
      expect(harness.toPlain(body)).toStrictEqual({
        error: expect.stringMatching(/^Failed to persist comment batch: .+$/u),
      });
    });
  });

  // Flow: send-message-with-images. Every case here resumes a real chaoswhisperer session
  // (registerRealGuild + configureFakeClaudeCli) so pastedImagePersistBroker's real fs writes and
  // pastedImageTokenSubstituteTransformer's real rewrite both run for real, driven by a real HTTP
  // POST through the real Hono route — not the mocked orchestrator adapters
  // quest-chat-responder.test.ts already covers. seedQuest's questFolder is always the questId
  // itself: pastedImagePersistBroker computes the images directory from
  // locationsQuestFolderPathFindBroker({guildId, questId}), which joins questId verbatim — never
  // whatever on-disk folder name a quest happens to live under — so only a questFolder === questId
  // seed lets a test read back the exact directory the broker just wrote to.
  describe('POST /api/quests/:questId/chat with images', () => {
    it("VALID: {images: [two distinct images], message carrying both tokens} => 200, exactly two files land, and the file each token's ordinal names holds that image's own posted bytes in posted order", async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-two-distinct' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6001-4222-8222-444444444444' });
      const seeded = await harness.seedGuildAndQuestFields({
        dungeonmasterHome,
        guildName: 'Chat Images Guild — Two Distinct',
        guildPath: dungeonmasterHome,
        fields: {
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6001-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId,
            }),
          ],
        },
      });
      const guildId = String(seeded.guild.id);
      const questId = seeded.quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'first [Pasted Image 1] then [Pasted Image 2]',
          images: [
            { mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' },
            { mediaType: 'image/jpeg', dataBase64: 'c2Vjb25kLWltYWdl' },
          ],
        }),
      });
      const tokenPaths = await harness.waitForClaudeInvocationImagePaths({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const tokenBytes = tokenPaths.map((filePath) => harness.readFileBase64({ filePath }));

      cli.restore();
      restore();

      expect(response.status).toBe(200);

      // Compares full paths (not bare names) — the images dir's own entries, joined back onto
      // its own dirPath, against the exact paths the rewritten message's tokens named. Equal sets
      // means the real fs holds precisely the two files the tokens reference, nothing extra and
      // nothing missing.
      const dirFullPathsSorted = dir.fileNames.map((name) => `${dir.dirPath}/${name}`).sort();
      const tokenPathsSorted = tokenPaths.map((filePath) => String(filePath)).sort();

      expect(dirFullPathsSorted).toStrictEqual(tokenPathsSorted);
      expect(tokenBytes).toStrictEqual(['Zmlyc3QtaW1hZ2U=', 'c2Vjb25kLWltYWdl']);
    });

    it('INVALID: {images: [6 entries]} => 400 naming the images field and writing zero files, beside a 5-entry send on the same quest which answers 200 and leaves exactly 5 files', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-cap' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6002-4222-8222-444444444444' });
      const seeded = await harness.seedGuildAndQuestFields({
        dungeonmasterHome,
        guildName: 'Chat Images Guild — Cap',
        guildPath: dungeonmasterHome,
        fields: {
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6002-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId,
            }),
          ],
        },
      });
      const guildId = String(seeded.guild.id);
      const questId = seeded.quest.id;

      const app = QuestFlow();
      const overCapImages = Array.from(
        { length: pastedImageStatics.maxImagesPerMessage + 1 },
        () => ({ mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' }),
      );
      const overCapResponse = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'far too many pictures', images: overCapImages }),
      });
      const overCapBody: unknown = await overCapResponse.json();
      const dirAfterOverCap = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      const atCapImages = Array.from({ length: pastedImageStatics.maxImagesPerMessage }, () => ({
        mediaType: 'image/png',
        dataBase64: 'Zmlyc3QtaW1hZ2U=',
      }));
      const atCapResponse = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'exactly the cap', images: atCapImages }),
      });
      const dirAfterAtCap = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      cli.restore();
      restore();

      expect(overCapResponse.status).toBe(400);
      expect(harness.toPlain(overCapBody)).toStrictEqual({
        error: `Array must contain at most ${String(pastedImageStatics.maxImagesPerMessage)} element(s)`,
      });
      expect(dirAfterOverCap.exists).toBe(false);
      expect(atCapResponse.status).toBe(200);
      // A real directory can never hold two entries sharing a name, so a Set built from real
      // fileNames landing at exactly this size proves the count without a bare `.length` check.
      expect(new Set(dirAfterAtCap.fileNames).size).toBe(pastedImageStatics.maxImagesPerMessage);
    });

    it("VALID: {images: [one image]} => the quest's images directory is absent before the send and present after the 200", async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-dir-created' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6003-4222-8222-444444444444' });
      const seeded = await harness.seedGuildAndQuestFields({
        dungeonmasterHome,
        guildName: 'Chat Images Guild — Dir Created',
        guildPath: dungeonmasterHome,
        fields: {
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6003-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId,
            }),
          ],
        },
      });
      const guildId = String(seeded.guild.id);
      const questId = seeded.quest.id;

      const dirBefore = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'a single picture',
          images: [{ mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' }],
        }),
      });
      const dirAfter = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      cli.restore();
      restore();

      expect(dirBefore.exists).toBe(false);
      expect(response.status).toBe(200);
      expect(dirAfter.exists).toBe(true);
    });

    it('VALID: {two sequential sends into the same quest} => the images directory keeps the same inode across both, and every file send 1 wrote is still present after send 2', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-not-recreated' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6004-4222-8222-444444444444' });
      const seeded = await harness.seedGuildAndQuestFields({
        dungeonmasterHome,
        guildName: 'Chat Images Guild — Not Recreated',
        guildPath: dungeonmasterHome,
        fields: {
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6004-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId,
            }),
          ],
        },
      });
      const guildId = String(seeded.guild.id);
      const questId = seeded.quest.id;

      const app = QuestFlow();
      const firstResponse = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'first send',
          images: [{ mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' }],
        }),
      });
      const dirAfterFirst = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      const secondResponse = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'second send',
          images: [{ mediaType: 'image/jpeg', dataBase64: 'c2Vjb25kLWltYWdl' }],
        }),
      });
      const dirAfterSecond = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      cli.restore();
      restore();

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(dirAfterSecond.ino).toBe(dirAfterFirst.ino);

      const sortedFirstNames = [...dirAfterFirst.fileNames].sort();
      const sortedSecondNames = [...dirAfterSecond.fileNames].sort();
      const secondNamesContainingFirst = sortedSecondNames.filter((name) =>
        sortedFirstNames.includes(name),
      );

      expect(secondNamesContainingFirst).toStrictEqual(sortedFirstNames);
    });

    it('VALID: {two sequential sends carrying the SAME dataBase64} => two files land under distinct names, and both read back to the exact posted bytes', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-identical' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6005-4222-8222-444444444444' });
      const seeded = await harness.seedGuildAndQuestFields({
        dungeonmasterHome,
        guildName: 'Chat Images Guild — Identical',
        guildPath: dungeonmasterHome,
        fields: {
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6005-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId,
            }),
          ],
        },
      });
      const guildId = String(seeded.guild.id);
      const questId = seeded.quest.id;

      const dataBase64 = 'Zmlyc3QtaW1hZ2U=';
      const app = QuestFlow();
      const firstResponse = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'first identical send',
          images: [{ mediaType: 'image/png', dataBase64 }],
        }),
      });
      const secondResponse = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'second identical send',
          images: [{ mediaType: 'image/png', dataBase64 }],
        }),
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const bytesRead = dir.fileNames.map((name) =>
        harness.readFileBase64({ filePath: `${dir.dirPath}/${name}` }),
      );

      cli.restore();
      restore();

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      // A real directory can never hold two entries sharing a name, so a Set landing at exactly 2
      // proves both "two files" and "two DISTINCT names" in one real-fs-backed assertion.
      expect(new Set(dir.fileNames).size).toBe(2);
      expect(bytesRead).toStrictEqual([dataBase64, dataBase64]);
    });

    // Fixture data, not derived from a static — pastedImageStatics has no list of hostile base64
    // payloads to derive from, per the flow's own UNITS spec.
    const HOSTILE_BASE64_CASES = [
      ['a 1-byte payload', 'QQ=='],
      ["a payload whose base64 ends in '==' padding", 'AQIDBA=='],
      ["a payload whose base64 carries '+' and '/'", '+///'],
    ] as const;

    it.each(HOSTILE_BASE64_CASES)(
      'VALID: {dataBase64: %s} => the written file bytes decode to exactly the posted base64',
      async (_label, dataBase64) => {
        const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-hostile' });
        const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
        const cli = harness.configureFakeClaudeCli();
        const sessionId = SessionIdStub({ value: 'bbbbbbbb-6006-4222-8222-444444444444' });
        const seeded = await harness.seedGuildAndQuestFields({
          dungeonmasterHome,
          guildName: 'Chat Images Guild — Hostile',
          guildPath: dungeonmasterHome,
          fields: {
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6006-4222-8222-444444444444' }),
                role: 'chaoswhisperer',
                status: 'in_progress',
                sessionId,
              }),
            ],
          },
        });
        const guildId = String(seeded.guild.id);
        const questId = seeded.quest.id;

        const app = QuestFlow();
        const response = await app.request(`/api/quests/${questId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'a hostile pasted-image payload',
            images: [{ mediaType: 'image/png', dataBase64 }],
          }),
        });
        const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
        const writtenBase64 = harness.readFileBase64({
          filePath: `${dir.dirPath}/${dir.fileNames[0]}`,
        });

        cli.restore();
        restore();

        expect(response.status).toBe(200);
        expect(new Set(dir.fileNames).size).toBe(1);
        expect(writtenBase64).toBe(dataBase64);
      },
    );

    // Flow: send-message-with-images. A chat work item's `sessionId` is stamped asynchronously —
    // chat-spawn-broker's onSessionId callback fires only once the spawned CLI's system/init line
    // streams back, via a SEPARATE quest write, after this HTTP response already resolved for
    // whichever turn spawned it. A second image-carrying send that lands in that window (or one
    // sent against a quest whose intake item is already `complete` with no sessionId ever
    // captured) must still land on the quest the URL already names — never mint a second one.
    it("VALID: {chaoswhisperer work item at status complete with NO sessionId} => 200, images land in THIS quest's own folder, and no second quest directory is created", async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-chat-images-no-session' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      // The write route mints a UUID `id`/`folder` for every seeded quest, which is what
      // isQuestFolderGuard (the quest LIST broker's directory filter, distinct from the
      // single-quest GET path used elsewhere in this file) needs to discover it below.
      const seeded = await harness.seedGuildAndQuestFields({
        dungeonmasterHome,
        guildName: 'Chat Images Guild — No Session',
        guildPath: dungeonmasterHome,
        fields: {
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6007-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'complete',
            }),
          ],
        },
      });
      const guildId = String(seeded.guild.id);
      const questId = seeded.quest.id;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'one more thing [Pasted Image 1]',
          images: [{ mediaType: 'image/png', dataBase64: 'bm8tc2Vzc2lvbg==' }],
        }),
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const listResponse = await app.request(`/api/quests?guildId=${guildId}`);
      const listBody: unknown = await listResponse.json();
      const listedQuestIds = harness.readListedQuestIds({ body: listBody });

      cli.restore();
      restore();

      expect(response.status).toBe(200);
      // The images the persist broker wrote land under THIS quest's own images directory.
      expect(new Set(dir.fileNames).size).toBe(1);
      // Exactly one quest exists for the guild afterward, and it is the SAME quest the URL named
      // — proof the orchestrator's resolution spawned into the existing quest rather than minting
      // a second one.
      expect(listedQuestIds).toStrictEqual([questId]);
    });
  });

  // Flow: screenshot-path-server-side. A real file on a real filesystem, referenced by its
  // absolute path in the message text rather than uploaded through `images` — the server's scan
  // finds it, copies it into the quest's own images folder, and rewrites the path to the same
  // `![Pasted Image N](...)` token a pasted bitmap produces. Every case here resumes a real
  // chaoswhisperer session (registerRealGuild + configureFakeClaudeCli), same reasoning as "chat
  // with images" above: only a real spawn proves what the agent's prompt really carries, and only
  // a real copy (not a mocked fs) proves the source survives untouched.
  describe('POST /api/quests/:questId/chat with a local image path in the message', () => {
    it('VALID: {message holding an absolute screenshot path} => 200, and the original file at that path still exists with its original bytes intact', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-local-image-source-kept' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Local Image Source Kept Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-local-image-source-kept';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-8001-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-8001-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-local-image-source-kept-fixture',
        fileName: 'local-screenshot.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4, 5, 6, 7, 8]),
      });
      const originalBase64 = harness.readFileBase64({ filePath: seeded.imagePath });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `see ${seeded.imagePath} ok` }),
      });
      const originalBase64After = harness.readFileBase64({ filePath: seeded.imagePath });

      cli.restore();
      restore();
      seeded.cleanup();

      expect(response.status).toBe(200);
      expect(originalBase64After).toBe(originalBase64);
    });

    it('VALID: {message holding an absolute screenshot path, original deleted after the send} => the quest images directory keeps exactly one file, holding the original bytes', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-local-image-copy-survives' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Local Image Copy Survives Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-local-image-copy-survives';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-8002-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-8002-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-local-image-copy-survives-fixture',
        fileName: 'deleted-screenshot.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 9, 8, 7, 6, 5, 4, 3, 2]),
      });
      const originalBase64 = harness.readFileBase64({ filePath: seeded.imagePath });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `see ${seeded.imagePath} ok` }),
      });

      // Removes the fixture directory — including the source file the message pointed at — only
      // after the send has resolved, so the copy this test is about has already happened.
      seeded.cleanup();

      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const [copiedFileName] = dir.fileNames;
      const copiedBase64 = harness.readFileBase64({ filePath: `${dir.dirPath}/${copiedFileName}` });

      cli.restore();
      restore();

      expect(response.status).toBe(200);
      // A real directory can never hold two entries sharing a name, so a Set landing at exactly 1
      // proves the copy is the ONLY file left, without a bare `.length` check.
      expect(new Set(dir.fileNames).size).toBe(1);
      expect(copiedBase64).toBe(originalBase64);
    });

    it("VALID: {images: [one bitmap], message carrying both a bare bitmap placeholder AND an absolute screenshot path} => the agent's prompt carries the read-the-images trailer exactly once", async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-local-image-trailer-once' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Local Image Trailer Once Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-local-image-trailer-once';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-8003-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-8003-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      // A distinct extension from the uploaded bitmap's ('png') is what lets this test tell the
      // two written files apart afterward without parsing the prompt it is trying to prove.
      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-local-image-trailer-once-fixture',
        fileName: 'trailer-screenshot.jpg',
        bytes: new Uint8Array([255, 216, 255, 224, 1, 2, 3, 4]),
      });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `first [Pasted Image 1] then see ${seeded.imagePath} ok`,
          images: [{ mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' }],
        }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const [bitmapFileName] = dir.fileNames.filter((name) => name.endsWith('.png'));
      const [screenshotFileName] = dir.fileNames.filter((name) => name.endsWith('.jpg'));

      cli.restore();
      restore();
      seeded.cleanup();

      // The bitmap is ordinal 1 (it is the only upload), the screenshot path is ordinal 2 (it is
      // found after the upload's own count) — pinning the WHOLE prompt is the strongest proof
      // available on the resume branch this quest's seeded sessionId puts the spawn on: a trailer
      // appended twice (once per image kind, rather than once for the whole message) would make
      // this string differ from what the fake CLI actually recorded.
      const expectedPrompt =
        `first ![Pasted Image 1](${dir.dirPath}/${bitmapFileName}) then see ` +
        `![Pasted Image 2](${dir.dirPath}/${screenshotFileName}) ok\n\n` +
        `${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(expectedPrompt);
    });

    it('VALID: {message with no absolute image path and no images array} => the agent receives the message byte-identical, with no read-the-images trailer appended', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-local-image-text-only' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Local Image Text Only Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-local-image-text-only';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-8004-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-8004-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const message = 'plain text with no screenshot path at all';

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const sentinelOccurrences = [
        ...actualPrompt.matchAll(new RegExp(pastedImageStatics.promptSentinel, 'gu')),
      ].map((match) => match[0]);

      cli.restore();
      restore();

      expect(response.status).toBe(200);
      expect(sentinelOccurrences).toStrictEqual([]);
      // Resume branch (this quest's chat work item carries a sessionId), so the whole `-p` prompt
      // is nothing but the message plus whatever trailer would have been appended — pinning it
      // against the posted message directly is the stronger proof that nothing else rides along.
      expect(actualPrompt).toBe(message);
    });
  });

  // Flow: screenshot-path-server-side. More cases against the SAME scan the block above already
  // proves happy-path: no absolute path anywhere in the text (three near-miss forms), a
  // well-formed path whose file was never written, a real file converted on a send that carries
  // no `images` key at all, every text shape the scan must accept in one message, a path already
  // sitting inside a token, the ordinal continuing past pasted bitmaps with the trailer appearing
  // once, the five-image cap counting both kinds together, a source file that exists but cannot
  // be read, a copy destination that cannot be written, and the source file surviving the send
  // while the copy survives the source's own later deletion. Same real-spawn shape as every block
  // above (registerRealGuild + configureFakeClaudeCli): only a real spawn proves the whole `-p`
  // prompt, and only a real fs read proves what actually landed on disk.
  describe('POST /api/quests/:questId/chat with screenshot-path scan branches', () => {
    it('VALID: {message carrying a relative path, a bare filename, and a URL — no absolute image path anywhere} => 200, the message forwarded byte-identical, no images directory created, and no read-the-images trailer appended', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-no-absolute-path' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot No Absolute Path Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-no-absolute-path';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9001-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9001-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const message = 'relative ./shot.png bare shot.png url https://example.com/a.png done';

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const sentinelOccurrences = [
        ...actualPrompt.matchAll(new RegExp(pastedImageStatics.promptSentinel, 'gu')),
      ].map((match) => match[0]);

      cli.restore();
      restore();

      expect(response.status).toBe(200);
      expect(dir.exists).toBe(false);
      expect(actualPrompt).toBe(message);
      expect(sentinelOccurrences).toStrictEqual([]);
    });

    it("VALID: {message holding an absolute path to a file that was never written} => 200, the unresolved path reaches the agent verbatim, and the quest's images directory gains no file", async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-missing-file' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Missing File Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-missing-file';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9002-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9002-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      // A real seeded directory with a real sibling file — only `never-written.png` itself is
      // absent, so the miss is "this file", never "this whole tree".
      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-missing-file-fixture',
        fileName: 'placeholder.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      });
      const missingPath = `${seeded.dirPath}/never-written.png`;
      const message = `see ${missingPath} ok`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      cli.restore();
      restore();
      seeded.cleanup();

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(message);
      // The broker mkdirs the quest's own images directory as soon as ANY text match is found —
      // whether or not that match's source file can actually be read — so a well-formed but
      // unresolved path leaves the directory PRESENT and EMPTY, never absent.
      expect({ exists: dir.exists, fileNames: dir.fileNames }).toStrictEqual({
        exists: true,
        fileNames: [],
      });
    });

    it('VALID: {message carrying an absolute screenshot path, POST body with no images key at all} => 200, the quest images directory gains exactly one uuid-named copy holding the source bytes, and the whole prompt shows the path replaced by its token', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-no-images-key' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot No Images Key Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-no-images-key';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9003-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9003-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      // Not uuid-shaped, unlike the copy's own name — a copy that reused the source name would
      // pass the uuid-shape check below only by accident of extension.
      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-no-images-key-fixture',
        fileName: 'a-screenshot.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 42, 43, 44, 45]),
      });
      const originalBase64 = harness.readFileBase64({ filePath: seeded.imagePath });
      const message = `before ${seeded.imagePath} after`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const [copiedFileName] = dir.fileNames;
      const copiedBase64 = harness.readFileBase64({ filePath: `${dir.dirPath}/${copiedFileName}` });

      cli.restore();
      restore();
      seeded.cleanup();

      const expectedPrompt =
        `before ![Pasted Image 1](${dir.dirPath}/${copiedFileName}) after\n\n` +
        `${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      expect(response.status).toBe(200);
      expect(new Set(dir.fileNames).size).toBe(1);
      expect(copiedFileName).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/u,
      );
      expect(copiedBase64).toBe(originalBase64);
      expect(actualPrompt).toBe(expectedPrompt);
    });

    it('VALID: {message carrying four absolute paths in every shape the scan must accept — two on one line, one parenthesized, one at the very end} => the whole prompt rewrites all four in order, and each token names a file holding its own source bytes', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-every-shape' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Every Shape Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-every-shape';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9004-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9004-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      // Four distinct extensions and four distinct byte arrays — a swapped ordinal-to-file mapping
      // reads identical to correct behavior when every fixture shares one extension, and only the
      // byte comparison below would catch it.
      const one = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-every-shape-one',
        fileName: 'one.png',
        bytes: new Uint8Array([1, 2, 3, 4]),
      });
      const two = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-every-shape-two',
        fileName: 'two.jpg',
        bytes: new Uint8Array([5, 6, 7, 8]),
      });
      const three = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-every-shape-three',
        fileName: 'three.gif',
        bytes: new Uint8Array([9, 10, 11, 12]),
      });
      const four = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-every-shape-four',
        fileName: 'four.webp',
        bytes: new Uint8Array([13, 14, 15, 16]),
      });
      const sourceBase64s = [one, two, three, four].map((seededFile) =>
        harness.readFileBase64({ filePath: seededFile.imagePath }),
      );
      const message =
        `first ${one.imagePath} and ${two.imagePath} on one line, ` +
        `then (${three.imagePath}) in parens, ending ${four.imagePath}`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const tokenPaths = await harness.waitForClaudeInvocationImagePaths({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const [firstPath, secondPath, thirdPath, fourthPath] = tokenPaths;
      const tokenBytes = tokenPaths.map((filePath) => harness.readFileBase64({ filePath }));

      cli.restore();
      restore();
      one.cleanup();
      two.cleanup();
      three.cleanup();
      four.cleanup();

      const expectedPrompt =
        `first ![Pasted Image 1](${firstPath}) and ![Pasted Image 2](${secondPath}) on one line, ` +
        `then (![Pasted Image 3](${thirdPath})) in parens, ending ![Pasted Image 4](${fourthPath})\n\n` +
        `${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(expectedPrompt);
      expect(tokenBytes).toStrictEqual(sourceBase64s);
    });

    it('VALID: {message carrying a path already inside a pasted-image token, POST body with no images key} => 200, the token survives whole plus the trailer, and the quest images directory is never created', async () => {
      const restore = harness.setupTestHome({
        baseName: 'quest-flow-screenshot-already-tokenised',
      });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Already Tokenised Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-already-tokenised';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9005-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9005-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-already-tokenised-fixture',
        fileName: 'already-tokenised.png',
        bytes: new Uint8Array([137, 80, 78, 71]),
      });
      const message = `look ![Pasted Image 1](${seeded.imagePath}) ok`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      cli.restore();
      restore();
      seeded.cleanup();

      const expectedPrompt = `${message}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(expectedPrompt);
      expect(dir.exists).toBe(false);
    });

    it("VALID: {images: [two distinct bitmaps], message carrying two bitmap placeholders and one absolute screenshot path} => the screenshot's token continues the ordinal after both bitmaps, and the read-the-images trailer appears exactly once", async () => {
      const restore = harness.setupTestHome({
        baseName: 'quest-flow-screenshot-ordinal-continues',
      });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Ordinal Continues Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-ordinal-continues';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9006-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9006-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      // A distinct extension from the uploaded bitmaps' ('png') is what lets this test tell the
      // screenshot's own written file apart from theirs without parsing the prompt it exists to
      // prove.
      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-ordinal-continues-fixture',
        fileName: 'ordinal-screenshot.jpg',
        bytes: new Uint8Array([255, 216, 255, 224, 1, 2, 3, 4]),
      });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `one [Pasted Image 1] two [Pasted Image 2] shot ${seeded.imagePath} end`,
          images: [
            { mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' },
            { mediaType: 'image/png', dataBase64: 'c2Vjb25kLWltYWdl' },
          ],
        }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const tokenPaths = await harness.waitForClaudeInvocationImagePaths({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const [firstBitmapPath, secondBitmapPath, screenshotPath] = tokenPaths;
      const sentinelOccurrences = [
        ...actualPrompt.matchAll(new RegExp(pastedImageStatics.promptSentinel, 'gu')),
      ].map((match) => match[0]);

      cli.restore();
      restore();
      seeded.cleanup();

      // The bitmaps are ordinals 1 and 2 (they are the only uploads), so the screenshot path found
      // after them must continue at 3 rather than restarting — the ordinal is written by hand here
      // rather than read back off the actual match, since an ordinal-collision bug would still put
      // the RIGHT path at the WRONG number and only a hand-written expectation catches that.
      const expectedPrompt =
        `one ![Pasted Image 1](${firstBitmapPath}) two ![Pasted Image 2](${secondBitmapPath}) ` +
        `shot ![Pasted Image 3](${screenshotPath}) end\n\n` +
        `${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(expectedPrompt);
      expect(sentinelOccurrences).toStrictEqual([pastedImageStatics.promptSentinel]);
    });

    it('VALID: {images: [maxImagesPerMessage distinct bitmaps], message carrying every placeholder plus one absolute screenshot path} => the bitmaps convert and the screenshot path is left raw, because the per-message cap counts both kinds together', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-cap-both-kinds' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Cap Both Kinds Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-cap-both-kinds';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9008-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9008-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-cap-both-kinds-fixture',
        fileName: 'over-cap-screenshot.jpg',
        bytes: new Uint8Array([255, 216, 255, 224, 9, 8, 7, 6]),
      });
      const atCapImages = Array.from({ length: pastedImageStatics.maxImagesPerMessage }, () => ({
        mediaType: 'image/png',
        dataBase64: 'Zmlyc3QtaW1hZ2U=',
      }));
      const placeholders = Array.from(
        { length: pastedImageStatics.maxImagesPerMessage },
        (_unused, index) => `[Pasted Image ${index + 1}]`,
      ).join(' ');
      const message = `${placeholders} shot ${seeded.imagePath} end`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, images: atCapImages }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const tokenPaths = await harness.waitForClaudeInvocationImagePaths({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      cli.restore();
      restore();
      seeded.cleanup();

      // Hand-written ordinals 1..5, same reasoning as the mixed-ordinal test above — the
      // screenshot's own path is a SIXTH candidate the ordinal filter drops before it ever reaches
      // the copy step, so it must survive as the exact raw string the message posted.
      const rewrittenPlaceholders = tokenPaths
        .map((filePath, index) => `![Pasted Image ${index + 1}](${filePath})`)
        .join(' ');
      const expectedPrompt =
        `${rewrittenPlaceholders} shot ${seeded.imagePath} end\n\n` +
        `${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;
      // The honest read: a bare count of 5 cannot tell "the screenshot was skipped" from "the
      // screenshot was copied and a bitmap was not" — the sorted extension list can.
      const sortedExtensions = [...dir.fileNames]
        .map((name) => name.slice(name.lastIndexOf('.') + 1))
        .sort();

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(expectedPrompt);
      expect(sortedExtensions).toStrictEqual(
        Array.from({ length: pastedImageStatics.maxImagesPerMessage }, () => 'png'),
      );
    });

    it('VALID: {message holding an absolute path to a real file chmod-ed unreadable} => 200, the message forwarded byte-identical, and the quest images directory gains no file', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-unreadable-file' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Unreadable File Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-unreadable-file';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9009-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9009-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-unreadable-file-fixture',
        fileName: 'unreadable-screenshot.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      });
      // The file-exists check upstream already saw the file; only the read itself must fail —
      // chmod'ing the FILE (not its directory) is what isolates that.
      const unreadable = harness.makeFileUnreadable({ filePath: seeded.imagePath });
      const message = `see ${seeded.imagePath} ok`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      // Restored before setupTestHome's own restore and before the fixture cleanup — that restore
      // recursively removes the temp tree and needs write permission on every directory in it.
      unreadable.restore();
      cli.restore();
      restore();
      seeded.cleanup();

      // The broker mkdirs the quest's own images directory as soon as one text match is found —
      // whether or not that match's source file can actually be read — so a well-formed but
      // unreadable path leaves the directory PRESENT and EMPTY, never absent (same shape as the
      // missing-file case above).
      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(message);
      expect({ exists: dir.exists, fileNames: dir.fileNames }).toStrictEqual({
        exists: true,
        fileNames: [],
      });
    });

    it('VALID: {message holding an absolute path to a real readable file, quest images directory pre-created and chmod-ed read-only} => 200, the message forwarded byte-identical, and the images directory gains no file', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-screenshot-copy-fails' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Copy Fails Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-copy-fails';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9010-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9010-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-copy-fails-fixture',
        fileName: 'copy-fails-screenshot.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      });
      // Pre-creates the quest's OWN images directory then strips its write bit — the broker's own
      // mkdir is recursive and succeeds as a no-op on an already-existing directory whatever its
      // mode, so only the file WRITE inside it fails.
      const readOnlyImagesDir = harness.makeQuestImagesDirectoryReadOnly({
        dungeonmasterHome,
        guildId,
        questId,
      });
      const message = `see ${seeded.imagePath} ok`;

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const actualPrompt = await harness.waitForClaudeInvocationPrompt({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });

      readOnlyImagesDir.restore();
      cli.restore();
      restore();
      seeded.cleanup();

      expect(response.status).toBe(200);
      expect(actualPrompt).toBe(message);
      // The sibling "yes" branch (the real-file-converted test above) leaves exactly one file; a
      // failed copy leaves zero.
      expect(dir.fileNames).toStrictEqual([]);
    });

    it('VALID: {message holding an absolute screenshot path} => the source file is unchanged immediately after the send, and once it is deleted the quest images directory still holds the copy carrying the source bytes', async () => {
      const restore = harness.setupTestHome({
        baseName: 'quest-flow-screenshot-source-and-copy-survive',
      });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Screenshot Source And Copy Survive Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-screenshot-source-and-copy-survive';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-9011-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-9011-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      await harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

      const seeded = await harness.seedImageFile({
        baseName: 'quest-flow-screenshot-source-and-copy-survive-fixture',
        fileName: 'survives-screenshot.png',
        bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 11, 22, 33, 44]),
      });
      const originalBase64 = harness.readFileBase64({ filePath: seeded.imagePath });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `see ${seeded.imagePath} ok` }),
      });
      const sourceBase64AfterSend = harness.readFileBase64({ filePath: seeded.imagePath });

      // The fixture directory (holding the ORIGINAL source file) is removed only after the source
      // has already been read back once — proving the send left it in place — so only THEN does
      // this test find out whether the copy survives the deletion.
      seeded.cleanup();

      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const [copiedFileName] = dir.fileNames;
      const copiedBase64AfterDelete = harness.readFileBase64({
        filePath: `${dir.dirPath}/${copiedFileName}`,
      });

      cli.restore();
      restore();

      expect(response.status).toBe(200);
      expect(sourceBase64AfterSend).toBe(originalBase64);
      expect(copiedBase64AfterDelete).toBe(originalBase64);
    });
  });

  // Flow: send-message-with-images, the CREATE surface. Mirrors the "chat with images" block
  // above, but for the FIRST message of a brand-new quest: no seedQuest, no pre-existing session —
  // the questId pastedImagePersistBroker needs to resolve <questFolder>/images does not exist
  // until THIS request mints it, unlike the chat/followup routes where the quest already exists.
  // registerRealGuild + configureFakeClaudeCli drive a real chaoswhisperer spawn so the real
  // pastedImagePersistBroker fs writes and the real token-rewrite both run, through the real Hono
  // route — not the mocked orchestrator adapter quest-new-responder.test.ts already covers.
  describe('POST /api/guilds/:guildId/quests with images', () => {
    it("VALID: {images: [two distinct images], message carrying both tokens} => 200, the created quest's images directory holds exactly the two posted files, and the rewritten prompt's tokens name them in posted order", async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-create-images-two-distinct' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const guild = await harness.registerRealGuild({
        name: 'Create Images Guild — Two Distinct',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);

      const app = QuestFlow();
      const response = await app.request(`/api/guilds/${guildId}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'first [Pasted Image 1] then [Pasted Image 2]',
          images: [
            { mediaType: 'image/png', dataBase64: 'Zmlyc3QtaW1hZ2U=' },
            { mediaType: 'image/jpeg', dataBase64: 'c2Vjb25kLWltYWdl' },
          ],
        }),
      });
      const body: unknown = await response.json();
      const questId = harness.readCreatedQuestId({ body: harness.toPlain(body) });

      const tokenPaths = await harness.waitForClaudeInvocationImagePaths({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });
      const dir = harness.readImagesDir({ dungeonmasterHome, guildId, questId });
      const tokenBytes = tokenPaths.map((filePath) => harness.readFileBase64({ filePath }));

      cli.restore();
      restore();

      expect(response.status).toBe(200);
      expect(dir.exists).toBe(true);

      // Compares full paths (not bare names) — the images dir's own entries, joined back onto its
      // own dirPath, against the exact paths the rewritten message's tokens named. Equal sets means
      // the real fs holds precisely the two files the tokens reference, nothing extra and nothing
      // missing.
      const dirFullPathsSorted = dir.fileNames.map((name) => `${dir.dirPath}/${name}`).sort();
      const tokenPathsSorted = tokenPaths.map((filePath) => String(filePath)).sort();

      expect(dirFullPathsSorted).toStrictEqual(tokenPathsSorted);
      expect(tokenBytes).toStrictEqual(['Zmlyc3QtaW1hZ2U=', 'c2Vjb25kLWltYWdl']);
    });
  });
});
