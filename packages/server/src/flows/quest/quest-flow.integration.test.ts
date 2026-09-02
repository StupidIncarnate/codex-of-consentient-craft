import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestCommentStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  SignoffStub,
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
      const questId = 'server-http-comment-quest';
      const questFolder = '001-server-http-comment-quest';
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
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'flows_approved' as never,
        flows: [flow],
        comments: [bareComment, observableComment],
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}`);
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
  // by hand. The seeded flow is deliberately mixed: a Siegemaster-added observable (which Flowrider
  // can never sign, so it must be absent from Flowrider's three numbers and present in
  // midQuestObservables), a confirmed terminal, an unconfirmable terminal on the other track, an
  // unsigned labelled branch, and one note of each of two kinds.
  describe('GET /api/quests/:questId/summary', () => {
    it('VALID: {quest with one signed terminal, one siegemaster-added observable, an unsigned branch and two notes} => 200 carrying per-track counts, the drift row, the unconfirmable debt and every note group', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-summary-get' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const questId = 'server-http-summary-quest';
      const questFolder = '001-server-http-summary-quest';
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flowriderConfirmed = SignoffStub({
        evidence: 'packages/web/src/flows/login/login.e2e.ts:31 — red without the redirect',
      });
      const siegemasterUnconfirmable = SignoffStub({
        verdict: 'unconfirmable',
        evidence: 'the sandbox refuses to bind port 3737, so no browser can reach the app',
        toSettle: 'Start the sandbox dev server on a free port, then re-walk this node.',
        at: '2026-01-02T00:00:00.000Z',
      });
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
            flowriderSignoff: flowriderConfirmed,
            siegemasterSignoff: siegemasterUnconfirmable,
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
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'in_progress' as never,
        flows: [flow],
        planningNotes: {
          blightLedger: [],
          questNotes: [openQuestionNote, toolingErrorNote],
          operationPlans: [],
        },
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/summary`);
      const body: unknown = await response.json();

      restore();

      // login-flow is runtime, so all three denominators measure it. Units: 1 terminal (dashboard,
      // the only node with no outgoing edge) + 1 labelled branch (e-success) + 1 observable + 7
      // off-map families. Codeweaver and Flowrider both shed the off-map families AND the
      // siegemaster-added observable, leaving terminal + branch each — but they read different
      // sign-off fields, so Flowrider's terminal (signed `flowriderSignoff`) counts confirmed while
      // Codeweaver's copy of the same two units carries no `codeweaverSignoff` at all and is fully
      // outstanding. Siegemaster keeps all 10, of which the terminal is unconfirmable and the other
      // 9 are outstanding.
      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        questId,
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            tracks: [
              { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
              { id: 'flowrider', confirmed: 1, unconfirmable: 0, outstanding: 1 },
              { id: 'siegemaster', confirmed: 0, unconfirmable: 1, outstanding: 9 },
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
        unconfirmable: [
          {
            id: 'login-flow:terminal:dashboard:siegemaster',
            unitId: 'login-flow:terminal:dashboard',
            flowId: 'login-flow',
            kind: 'terminal',
            track: 'siegemaster',
            signoff: harness.toPlain(siegemasterUnconfirmable),
          },
        ],
        noteGroups: [
          { id: 'open-question', notes: [harness.toPlain(openQuestionNote)] },
          { id: 'tooling-error', notes: [harness.toPlain(toolingErrorNote)] },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
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

      harness.seedQuest({
        dungeonmasterHome,
        guildId,
        questFolder: '001-server-http-summary-decoy',
        quest: QuestStub({
          id: 'server-http-summary-decoy' as never,
          folder: '001-server-http-summary-decoy' as never,
        }),
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
        body: JSON.stringify({ workItemId, signal: 'complete', operationStatus: 'done' }),
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
      const questId = 'server-http-empty-batch-quest';
      const questFolder = '001-server-http-empty-batch-quest';
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
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'flows_approved' as never,
        flows: [flow],
        comments: [existingComment],
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

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
      const questId = 'server-http-malformed-entry-quest';
      const questFolder = '001-server-http-malformed-entry-quest';
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
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'flows_approved' as never,
        flows: [flow],
        comments: [existingComment],
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

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

    it('EDGE: {quest on disk carries no chaoswhisperer or glyphsmith work item with a sessionId} => returns 404 and persists no comments', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-no-session' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const questId = 'server-http-no-session-quest';
      const questFolder = '001-server-http-no-session-quest';
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'flows_approved' as never,
        flows: [flow],
        workItems: [],
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

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
    it('EDGE: {batch of 3 comments — two sharing one valid anchor, one naming a deleted node} => returns 409 naming only the stale anchor, persists no comments, and spawns ZERO real chat processes — paired against a follow-up valid batch that reaches a genuine non-zero spawn in the same environment', async () => {
      const restore = harness.setupTestHome({ baseName: 'quest-flow-comments-stale' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const cli = harness.configureFakeClaudeCli();
      const questId = 'server-http-stale-anchor-quest';
      const questFolder = '001-server-http-stale-anchor-quest';

      // A REAL guild, registered via the orchestrator's own public API — guildGetBroker (invoked
      // deep inside chatSpawnBroker on any path that reaches a resume) needs it in config.json;
      // seedQuest's glob-based quest lookup alone does not require this.
      const guild = await harness.registerRealGuild({
        name: 'Stale Anchor Guild',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-2222-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'flows_approved' as never,
        flows: [flow],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-2222-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

      const app = QuestFlow();
      const staleResponse = await app.request(`/api/quests/${questId}/comments`, {
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
      const staleBody: unknown = await staleResponse.json();
      const getAfterStale = await app.request(`/api/quests/${questId}`);
      const questAfterStale: unknown = await getAfterStale.json();

      // Bounded wait for a spawn this rejected batch must never produce.
      const invocationAfterStale = await harness.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 2000,
      });

      // Pair: the SAME environment, a batch whose lone anchor resolves, reaches a real spawn —
      // proving the empty ledger above is a genuine absence, not a selector that would read empty
      // regardless (a typo'd queue dir, an unregistered guild, a missing sessionId).
      const validResponse = await app.request(`/api/quests/${questId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: [
            { flowId: 'login-flow', nodeId: 'start', text: 'A valid comment that really sends' },
          ],
        }),
      });
      const invocationAfterValid = await harness.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: dungeonmasterHome,
        timeoutMs: 8000,
      });

      cli.restore();
      restore();

      expect(staleResponse.status).toBe(409);
      expect(harness.toPlain(staleBody)).toStrictEqual({
        error: 'Comment anchor no longer exists on the quest',
        staleAnchors: [{ flowId: 'login-flow', nodeId: 'deleted-node' }],
      });
      expect(harness.toPlain(questAfterStale)).toStrictEqual({
        success: true,
        quest: harness.toPlain(quest),
      });
      expect(invocationAfterStale).toBe(null);

      expect(validResponse.status).toBe(200);
      expect(invocationAfterValid).toStrictEqual({
        resumeSessionId: sessionId,
        prompt:
          'Flow "Login Flow" / node `start` ("Start")\nUser Comment: A valid comment that really sends',
      });
    }, 15000);

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
      const questId = 'server-http-persist-fail-quest';
      const questFolder = '001-server-http-persist-fail-quest';
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
        edges: [],
      });
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
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
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });
      const readOnlyDir = harness.makeQuestDirectoryReadOnly({
        dungeonmasterHome,
        guildId,
        questFolder,
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
      const guild = await harness.registerRealGuild({
        name: 'Chat Images Guild — Two Distinct',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-chat-images-two-distinct';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6001-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6001-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

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
      const guild = await harness.registerRealGuild({
        name: 'Chat Images Guild — Cap',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-chat-images-cap';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6002-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6002-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

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
      const guild = await harness.registerRealGuild({
        name: 'Chat Images Guild — Dir Created',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-chat-images-dir-created';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6003-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6003-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

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
      const guild = await harness.registerRealGuild({
        name: 'Chat Images Guild — Not Recreated',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-chat-images-not-recreated';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6004-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6004-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

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
      const guild = await harness.registerRealGuild({
        name: 'Chat Images Guild — Identical',
        path: dungeonmasterHome,
      });
      const guildId = String(guild.id);
      const questId = 'server-http-chat-images-identical';
      const sessionId = SessionIdStub({ value: 'bbbbbbbb-6005-4222-8222-444444444444' });
      const quest = QuestStub({
        id: questId as never,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6005-4222-8222-444444444444' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
            sessionId,
          }),
        ],
      });
      harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

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
        const guild = await harness.registerRealGuild({
          name: 'Chat Images Guild — Hostile',
          path: dungeonmasterHome,
        });
        const guildId = String(guild.id);
        const questId = 'server-http-chat-images-hostile';
        const sessionId = SessionIdStub({ value: 'bbbbbbbb-6006-4222-8222-444444444444' });
        const quest = QuestStub({
          id: questId as never,
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: 'aaaaaaaa-6006-4222-8222-444444444444' }),
              role: 'chaoswhisperer',
              status: 'in_progress',
              sessionId,
            }),
          ],
        });
        harness.seedQuest({ dungeonmasterHome, guildId, questFolder: questId, quest });

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
  });
});
