import {
  FlowNodeStub,
  FlowStub,
  QuestCommentStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
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
      const sessionId = 'bbbbbbbb-2222-4222-8222-444444444444';
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        status: 'flows_approved' as never,
        flows: [flow],
        workItems: [
          {
            id: 'aaaaaaaa-2222-4222-8222-444444444444',
            role: 'chaoswhisperer',
            status: 'in_progress',
            spawnerType: 'agent',
            sessionId,
            relatedDataItems: [],
            dependsOn: [],
            attempt: 0,
            maxAttempts: 1,
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ] as never,
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
          {
            id: 'aaaaaaaa-4444-4222-8222-444444444444',
            role: 'chaoswhisperer',
            status: 'in_progress',
            spawnerType: 'agent',
            sessionId: 'bbbbbbbb-4444-4222-8222-444444444444',
            relatedDataItems: [],
            dependsOn: [],
            attempt: 0,
            maxAttempts: 1,
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ] as never,
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
