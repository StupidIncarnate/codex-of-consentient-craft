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
});
