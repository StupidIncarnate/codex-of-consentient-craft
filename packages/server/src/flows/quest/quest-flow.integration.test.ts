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
        question: 'Which port should the sandbox dev server use?',
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
          blightReports: [],
          qaLedger: [],
          blightLedger: [],
          questNotes: [openQuestionNote, toolingErrorNote],
        },
      });

      harness.seedQuest({ dungeonmasterHome, guildId, questFolder, quest });

      const app = QuestFlow();
      const response = await app.request(`/api/quests/${questId}/summary`);
      const body: unknown = await response.json();

      restore();

      // login-flow is runtime, so all three denominators measure it. Units: 1 terminal (dashboard,
      // the only node with no outgoing edge) + 1 labelled branch (e-success) + 1 observable + 7
      // off-map families. The two authoring denominators shed the off-map families AND the
      // siegemaster-added observable, leaving terminal (confirmed) + branch (outstanding) each —
      // this quest tags no `packagesAffected`, so no node's package kind resolves and the
      // flowrider/groundstomper split does not bind. Siegemaster keeps all 10, of which the terminal
      // is unconfirmable and the other 9 are outstanding.
      expect(response.status).toBe(200);
      expect(harness.toPlain(body)).toStrictEqual({
        questId,
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            tracks: [
              { id: 'flowrider', confirmed: 1, unconfirmable: 0, outstanding: 1 },
              { id: 'groundstomper', confirmed: 1, unconfirmable: 0, outstanding: 1 },
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
});
