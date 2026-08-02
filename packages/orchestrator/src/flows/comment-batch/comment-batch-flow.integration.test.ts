import {
  CommentBatchEntryStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildIdStub,
  QuestCommentStub,
  QuestIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

import { CommentBatchFlow } from './comment-batch-flow';

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('CommentBatchFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  describe('export', () => {
    it('VALID: CommentBatchFlow => exports an async function', () => {
      expect(CommentBatchFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('persist gates delivery — real disk, no guild ever resolved on the reject path', () => {
    it('ERROR: {questId with no quest on disk} => rejects with the persist failure, never reaching the chat-resume step', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cbf-no-quest' }),
      });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const questId = QuestIdStub();
      const sessionId = SessionIdStub();

      const error = await CommentBatchFlow({
        guildId: GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' }),
        sessionId,
        questId,
        comments: [CommentBatchEntryStub({ flowId: 'login-flow', nodeId: 'start' })],
      }).catch((thrown: unknown) => thrown);

      home.restore();

      const prefix = 'Failed to persist comment batch: ';

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message.slice(0, prefix.length)).toBe(prefix);
    });
  });

  describe('successful persist — real read-modify-write against the real quest.json', () => {
    it('VALID: {quest already carrying one historic comment, batch of two new comments — node-anchored and observable-anchored, one hostile} => appends both new comments with distinct minted ids alongside the untouched historic one, then reaches the chat-resume step for real', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cbf-persist' }),
      });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const observable = FlowObservableStub({
        id: 'redirects-to-dashboard',
        description: 'Redirects to the dashboard',
      });
      const node = FlowNodeStub({ id: 'start', label: 'Start Page', observables: [observable] });
      const flow = FlowStub({ id: 'login-flow', name: 'Login Flow', nodes: [node] });
      const sessionId = SessionIdStub();
      const historicComment = QuestCommentStub({
        id: 'aaaaaaaa-0000-4000-8000-000000000001',
        flowId: 'login-flow',
        nodeId: 'start',
        text: 'Old historic comment',
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      await questHelper.seedFlowsAndComments({
        questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
        comments: [historicComment],
      });

      // Hostile member: text carrying a newline and markup-like content, proving persistence
      // survives it byte for byte.
      const hostileText = 'Second comment\nwith a newline and `inline code`';

      const error = await CommentBatchFlow({
        // A guild that does not exist — the comment persist has already run to completion by
        // the time chatSpawnBroker's guildGetBroker call rejects, so this reaches the
        // chat-resume step for real without risking an actual OS-level Claude CLI spawn.
        guildId: GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' }),
        sessionId,
        questId,
        comments: [
          CommentBatchEntryStub({
            flowId: 'login-flow',
            nodeId: 'start',
            text: 'First comment',
            createdAt: '2024-02-01T00:00:00.000Z' as never,
          }),
          CommentBatchEntryStub({
            flowId: 'login-flow',
            nodeId: 'start',
            observableId: 'redirects-to-dashboard',
            text: hostileText as never,
            createdAt: '2024-02-01T00:00:01.000Z' as never,
          }),
        ],
      }).catch((thrown: unknown) => thrown);

      const reloadedQuest = await questHelper.reload({ questId });
      home.restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        'Guild not found: 00000000-0000-0000-0000-000000000000',
      );

      const { comments } = reloadedQuest;
      const secondId = comments[1]!.id;
      const thirdId = comments[2]!.id;

      expect(secondId).toMatch(UUID_SHAPE);
      expect(thirdId).toMatch(UUID_SHAPE);
      expect(new Set([secondId, thirdId]).size).toBe(2);
      expect(comments).toStrictEqual([
        historicComment,
        {
          id: secondId,
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'First comment',
          createdAt: '2024-02-01T00:00:00.000Z',
        },
        {
          id: thirdId,
          flowId: 'login-flow',
          nodeId: 'start',
          observableId: 'redirects-to-dashboard',
          text: hostileText,
          createdAt: '2024-02-01T00:00:01.000Z',
        },
      ]);
    });
  });

  // A mocked spawner cannot prove either half of "resumes with --resume <sessionId> and the
  // markdown as -p" — it proves the mock, not the real argv. These drive a REAL guild + REAL
  // chaoswhisperer session through the full chatSpawnBroker -> agentLaunchBroker ->
  // child-process-spawn-stream-json-adapter chain against the fake-Claude-CLI binary (which
  // records every invocation's real argv to invocations.jsonl BEFORE it even reads its response
  // queue), so both check-resume-uses-session-id and check-markdown-is-prompt are proven against
  // the actual OS process, not a stand-in.
  describe('real chat resume — spawns a real (fake) Claude CLI process and records its argv', () => {
    it('VALID: {quest already carrying one historic comment on a node, a fresh 3-comment batch mixing node+observable anchors with hostile text} => the spawned process receives --resume <sessionId> and the exact markdown (quest-side labels, no historic comment, correct dividers) as -p', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cbf-real-spawn-success' }),
      });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const cli = questHelper.configureFakeClaudeCli();
      const { guild, questId } = await questHelper.createGuildAndQuest({ testbed });

      // Labels distinctive enough that they could only have come from quest.flows — the wire
      // contract (commentBatchEntryContract) carries no label/description field at all, so
      // there is no request-side value that could produce these strings by coincidence.
      const observable = FlowObservableStub({
        id: 'redirects-to-dashboard',
        description: 'Distinctive Observable Description From Quest',
      });
      const node = FlowNodeStub({
        id: 'start',
        label: 'Distinctive Node Label From Quest',
        observables: [observable],
      });
      const flow = FlowStub({ id: 'login-flow', name: 'Distinctive Flow Name', nodes: [node] });
      const sessionId = SessionIdStub({ value: 'real-spawn-session-abc' });
      const historicComment = QuestCommentStub({
        id: 'aaaaaaaa-0000-4000-8000-000000000099',
        flowId: 'login-flow',
        nodeId: 'start',
        text: 'This historic comment must NOT appear in the built markdown',
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      await questHelper.seedFlowsAndComments({
        questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
        comments: [historicComment],
      });

      const result = await CommentBatchFlow({
        guildId: guild.id,
        sessionId,
        questId,
        comments: [
          // Hostile: a line reading "---" (single newlines, so it does not collide with the
          // transformer's own '\n\n---\n\n' divider sequence — see the transformer's own hostile
          // divider-collision test for the case where it DOES collide).
          CommentBatchEntryStub({
            flowId: 'login-flow',
            nodeId: 'start',
            text: 'Careful:\n---\nDo not merge yet' as never,
          }),
          // Hostile: the literal label text "User Comment:" embedded mid-text.
          CommentBatchEntryStub({
            flowId: 'login-flow',
            nodeId: 'start',
            observableId: 'redirects-to-dashboard',
            text: 'This has a fake User Comment: label injected inline' as never,
          }),
          CommentBatchEntryStub({
            flowId: 'login-flow',
            nodeId: 'start',
            text: 'Third, ordinary comment' as never,
          }),
        ],
      });

      const invocation = await questHelper.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: testbed.guildPath,
        timeoutMs: 8000,
      });

      cli.restore();
      home.restore();
      testbed.cleanup();

      expect(result.chatProcessId).toMatch(
        /^chat-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
      );

      const expectedMarkdown =
        'Flow "Distinctive Flow Name" / node `start` ("Distinctive Node Label From Quest")\n' +
        'User Comment: Careful:\n---\nDo not merge yet' +
        '\n\n---\n\n' +
        'Flow "Distinctive Flow Name" / observable `redirects-to-dashboard` ("Distinctive Observable Description From Quest") on node `start`\n' +
        'User Comment: This has a fake User Comment: label injected inline' +
        '\n\n---\n\n' +
        'Flow "Distinctive Flow Name" / node `start` ("Distinctive Node Label From Quest")\n' +
        'User Comment: Third, ordinary comment';

      expect(invocation).toStrictEqual({
        resumeSessionId: sessionId,
        prompt: expectedMarkdown,
      });
    }, 15000);
  });

  // dd-persist-before-deliver's zero-process guarantee on the persist-failure path is provable
  // ONLY in an environment where a real process really could have been spawned — see
  // check-persist-failure-no-chat-turn. Reusing the exact same real-guild + real-fake-CLI
  // environment as the success test above (rather than an environment with no working
  // CLAUDE_CLI_PATH at all) is what makes the absence meaningful: the ledger genuinely had a
  // live binary to record into, and nothing arrived.
  describe('real chat resume — persist failure spawns zero real chat processes', () => {
    it('ERROR: {questId with no quest on disk, fake-CLI environment configured for a real spawn} => CommentBatchFlow rejects AND no claude CLI invocation is ever recorded', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cbf-real-spawn-persist-fail' }),
      });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const cli = questHelper.configureFakeClaudeCli();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'real-spawn-session-no-quest' });

      const error = await CommentBatchFlow({
        guildId: GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' }),
        sessionId,
        questId,
        comments: [CommentBatchEntryStub({ flowId: 'login-flow', nodeId: 'start' })],
      }).catch((thrown: unknown) => thrown);

      // Bounded wait for a spawn that this path must never produce — the invocation ledger is
      // written synchronously by the CLI's own startup code, well inside this window, so its
      // continued absence past the deadline is the honest "never happened" signal.
      const invocation = await questHelper.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: testbed.guildPath,
        timeoutMs: 2000,
      });

      cli.restore();
      home.restore();
      testbed.cleanup();

      const prefix = 'Failed to persist comment batch: ';

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message.slice(0, prefix.length)).toBe(prefix);
      expect(invocation).toBe(null);
    }, 15000);
  });
});
