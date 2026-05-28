import {
  AgentPromptResultStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { InteractionHandleResponderProxy } from './interaction-handle-responder.proxy';

describe('InteractionHandleResponder', () => {
  describe('signal-back', () => {
    it('VALID: {signal: complete, questId, workItemId} => returns JSON result', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'signal-back' }),
        args: {
          signal: 'complete',
          summary: 'Step completed successfully',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('VALID: {signal: failed, questId, workItemId} => returns JSON result', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'signal-back' }),
        args: {
          signal: 'failed',
          summary: 'Tests failing in user-fetch-broker',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('get-agent-prompt', () => {
    it('VALID: {agent, questId, workItemId} => returns augmented prompt from adapter', async () => {
      const proxy = InteractionHandleResponderProxy();
      proxy.setupCleanState();
      const expectedResult = AgentPromptResultStub({
        name: 'codeweaver',
        prompt: 'You are codeweaver.\n\n---\n\n## Work item context\n\n- questId: add-auth',
      });
      proxy.setupAgentPromptReturns({ result: expectedResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: {
          agent: 'codeweaver',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    it('VALID: {_meta.claudecode/toolUseId + matching meta.json sidecar in any session dir} => stamps work item via toolUseId scan', async () => {
      const proxy = InteractionHandleResponderProxy();
      proxy.setupCleanState();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-dedup',
        prompt: 'You are pathseeker-dedup.',
      });
      proxy.setupAgentPromptReturns({ result: expectedResult });

      const questId = QuestIdStub({ value: '3df2f4be-20b8-4517-8f08-69d570db7421' });
      const workItemId = QuestWorkItemIdStub({
        value: 'c6afab8f-ebdd-4e23-99cd-ea9aa67a5026',
      });
      const parentSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
      const realAgentId = 'ad0775d7695b4d4eb';
      const toolUseId = 'toolu_01KfM8kWZATagwS33eTq5fZS';

      proxy.setupCwd({ path: '/home/user/proj' });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupDungeonmasterHome({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
      });
      proxy.enqueueSessionsDir({ entries: [`${parentSessionId}.jsonl`] });
      proxy.enqueueSubagentsDir({ entries: [`agent-${realAgentId}.meta.json`] });
      proxy.enqueueMetaFileContents({
        contents: JSON.stringify({
          agentType: 'general-purpose',
          description: 'pathseeker-dedup dispatch',
          toolUseId,
        }),
      });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-dedup', questId, workItemId },
        meta: { 'claudecode/toolUseId': toolUseId, progressToken: 3 },
      });

      expect(proxy.getLastModifyQuestInput()).toStrictEqual({
        questId,
        workItems: [
          {
            id: workItemId,
            sessionId: parentSessionId,
            agentId: realAgentId,
            status: 'in_progress',
            startedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u),
          },
        ],
      });
    });

    it('VALID: {meta absent} => skips work item stamp, still returns prompt', async () => {
      const proxy = InteractionHandleResponderProxy();
      proxy.setupCleanState();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-surface',
        prompt: 'You are pathseeker-surface.',
      });
      proxy.setupAgentPromptReturns({ result: expectedResult });

      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-surface', questId, workItemId },
      });

      expect(proxy.getLastModifyQuestInput()).toBe(undefined);
      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    it('VALID: {meta has toolUseId but no matching sidecar anywhere} => skips work item stamp, still returns prompt', async () => {
      const proxy = InteractionHandleResponderProxy();
      proxy.setupCleanState();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-surface',
        prompt: 'You are pathseeker-surface.',
      });
      proxy.setupAgentPromptReturns({ result: expectedResult });

      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });

      proxy.setupCwd({ path: '/home/user/proj' });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupDungeonmasterHome({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
      });
      proxy.enqueueSessionsDirMissing();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-surface', questId, workItemId },
        meta: { 'claudecode/toolUseId': 'toolu_01KfM8kWZATagwS33eTq5fZS' },
      });

      expect(proxy.getLastModifyQuestInput()).toBe(undefined);
      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    it('ERROR: {missing questId} => throws clear rejection error', async () => {
      const proxy = InteractionHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-agent-prompt' }),
          args: {
            agent: 'codeweaver',
            workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
          },
        }),
      ).rejects.toThrow(/get-agent-prompt requires \{agent, questId, workItemId\}/u);
    });

    it('ERROR: {missing workItemId} => throws clear rejection error', async () => {
      const proxy = InteractionHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-agent-prompt' }),
          args: {
            agent: 'codeweaver',
            questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          },
        }),
      ).rejects.toThrow(/get-agent-prompt requires \{agent, questId, workItemId\}/u);
    });

    it('ERROR: {missing both questId and workItemId} => throws clear rejection error', async () => {
      const proxy = InteractionHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-agent-prompt' }),
          args: { agent: 'chaoswhisperer-gap-minion' },
        }),
      ).rejects.toThrow(/get-agent-prompt requires \{agent, questId, workItemId\}/u);
    });
  });

  describe('unknown tool', () => {
    it('ERROR: {tool: unknown-tool} => throws unknown tool error', async () => {
      const proxy = InteractionHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'unknown-tool' }),
          args: {},
        }),
      ).rejects.toThrow(/Unknown interaction tool/u);
    });
  });
});
