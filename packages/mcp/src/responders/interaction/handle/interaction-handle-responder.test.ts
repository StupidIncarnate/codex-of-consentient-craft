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

    it('VALID: {matching subagent JSONL on disk} => stamps workItem.sessionId=parentSessionId + workItem.agentId=realAgentId via modify-quest', async () => {
      const proxy = InteractionHandleResponderProxy();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-surface',
        prompt: 'You are pathseeker-surface.',
      });
      proxy.setupAgentPromptReturns({ result: expectedResult });

      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      const parentSessionId = '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402';
      const realAgentId = 'acd35f7b7763e33e8';

      proxy.setupParentSession({
        homedir: '/home/user',
        cwd: '/home/user/proj',
        sessionEntries: [{ name: `${parentSessionId}.jsonl`, mtimeMs: 1000 }],
      });
      proxy.setupSubagentMatch({
        files: [`agent-${realAgentId}.jsonl`],
        matchFilename: `agent-${realAgentId}.jsonl`,
        // JSON-encoded prompt body — backslash-escaped quotes around the UUIDs
        // mirror what Claude CLI actually writes to subagents/agent-*.jsonl.
        matchFirstLine: `{"type":"user","message":{"role":"user","content":"Call mcp__dungeonmaster__get-agent-prompt({\\n  agent: \\"pathseeker-surface\\",\\n  workItemId: \\"${String(workItemId)}\\",\\n  questId: \\"${String(questId)}\\"\\n})"}}`,
      });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-surface', questId, workItemId },
      });

      expect(proxy.getLastModifyQuestInput()).toStrictEqual({
        questId,
        workItems: [
          {
            id: workItemId,
            sessionId: parentSessionId,
            agentId: realAgentId,
          },
        ],
      });
    });

    it('VALID: {no matching subagent file} => skips stamp, still returns prompt', async () => {
      const proxy = InteractionHandleResponderProxy();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-surface',
        prompt: 'You are pathseeker-surface.',
      });
      proxy.setupAgentPromptReturns({ result: expectedResult });

      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });

      proxy.setupParentSession({
        homedir: '/home/user',
        cwd: '/home/user/proj',
        sessionEntries: [{ name: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402.jsonl', mtimeMs: 1000 }],
      });
      proxy.setupSubagentDirMissing();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-surface', questId, workItemId },
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
