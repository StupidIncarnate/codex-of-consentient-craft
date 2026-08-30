import {
  AgentPromptResultStub,
  OperationItemIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { InteractionHandleResponderProxy } from './interaction-handle-responder.proxy';

describe('InteractionHandleResponder', () => {
  describe('signal-back', () => {
    it('VALID: {signal: complete, operationStatus: done, questId, workItemId} => returns JSON result', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'signal-back' }),
        args: {
          signal: 'complete',
          operationItemId: OperationItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' }),
          operationStatus: 'done',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('VALID: {signal: complete, operationStatus: partial, questId, workItemId} => returns JSON result', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'signal-back' }),
        args: {
          signal: 'complete',
          operationStatus: 'partial',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('ask-user-question', () => {
    it('VALID: {questions} => returns the wait-or-continue instruction keyed on the caller shape', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'ask-user-question' }),
        args: {
          questions: [
            {
              question: 'Which database?',
              header: 'Database',
              options: [{ label: 'Postgres', description: 'Relational DB' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: [
              'Questions sent to the user.',
              "If you are an INTERACTIVE session (you were started by a slash command or a chat, and you have no work item): their answers arrive as your next user message. Do NOT continue generating — stop here and wait for the session to resume with the user's response.",
              'If you are a DISPATCHED WORK-ITEM agent (you fetched your prompt with get-agent-prompt and a workItemId): nothing will resume you, so do NOT wait. Record the question and the fact that it is outstanding in your handoff, keep working through the rest of your prompt, and finish your turn with signal-back as normal.',
            ].join(' '),
          },
        ],
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
      proxy.setupAgentPromptReturns({
        agent: 'codeweaver',
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        result: expectedResult,
      });

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

    it('VALID: {_meta.claudecode/toolUseId + matching tool_use line in sub-agent JSONL} => stamps work item via JSONL scan', async () => {
      const proxy = InteractionHandleResponderProxy();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-dedup',
        prompt: 'You are pathseeker-dedup.',
      });

      const questId = QuestIdStub({ value: '3df2f4be-20b8-4517-8f08-69d570db7421' });
      const workItemId = QuestWorkItemIdStub({
        value: 'c6afab8f-ebdd-4e23-99cd-ea9aa67a5026',
      });
      proxy.setupAgentPromptReturns({ agent: 'pathseeker-dedup', questId, result: expectedResult });
      const parentSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
      const realAgentId = 'ad0775d7695b4d4eb';
      const toolUseId = 'toolu_011pw36EFwmLorR7MdaSDEQG';

      proxy.setupCwd({ path: '/home/user/proj' });
      proxy.setupSessionsDir({
        homedir: '/home/user',
        projectDir: '/home/user/proj',
        sessionIds: [parentSessionId],
      });
      proxy.setupSubagentsDir({
        homedir: '/home/user',
        projectDir: '/home/user/proj',
        sessionId: parentSessionId,
        agentFilenames: [`agent-${realAgentId}.jsonl`],
      });
      proxy.setupAgentFile({
        homedir: '/home/user',
        projectDir: '/home/user/proj',
        sessionId: parentSessionId,
        agentFilename: `agent-${realAgentId}.jsonl`,
        contents: JSON.stringify({
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: toolUseId,
                name: 'mcp__dungeonmaster__get-agent-prompt',
                input: {},
              },
            ],
          },
        }),
      });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-dedup', questId, workItemId },
        meta: { 'claudecode/toolUseId': toolUseId, progressToken: 3 },
      });

      expect(proxy.getLastModifyQuestInput({ questId })).toStrictEqual({
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
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-surface',
        prompt: 'You are pathseeker-surface.',
      });
      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      proxy.setupAgentPromptReturns({
        agent: 'pathseeker-surface',
        questId,
        result: expectedResult,
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-surface', questId, workItemId },
      });

      expect(proxy.getLastModifyQuestInput({ questId })).toBe(undefined);
      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    it('VALID: {meta has toolUseId but no matching JSONL anywhere} => skips work item stamp, still returns prompt', async () => {
      const proxy = InteractionHandleResponderProxy();
      const expectedResult = AgentPromptResultStub({
        name: 'pathseeker-surface',
        prompt: 'You are pathseeker-surface.',
      });
      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      const workItemId = QuestWorkItemIdStub({
        value: '875c3364-2d64-4606-b9e3-25dd365c7792',
      });
      proxy.setupAgentPromptReturns({
        agent: 'pathseeker-surface',
        questId,
        result: expectedResult,
      });

      proxy.setupCwd({ path: '/home/user/proj' });
      proxy.setupSessionsDirMissing({ homedir: '/home/user', projectDir: '/home/user/proj' });
      // (No setupDungeonmasterHome — no announce happens in this flow)

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'pathseeker-surface', questId, workItemId },
        meta: { 'claudecode/toolUseId': 'toolu_01KfM8kWZATagwS33eTq5fZS' },
      });

      expect(proxy.getLastModifyQuestInput({ questId })).toBe(undefined);
      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    // A minion's name is the whole selection — there is no `discipline` to forward. What
    // the responder must NOT forward is a workItemId: that is what `subagentStopNeedsBlockGuard`
    // reads as proof the caller owes a signal-back, and the only item a minion could signal on is
    // its parent's. So the key is absent from the adapter call, not merely undefined.
    it("VALID: {agent: 'codeweaver-reviewer', questId, no workItemId} => forwards {agent, questId} alone to the adapter", async () => {
      const proxy = InteractionHandleResponderProxy();
      const expectedResult = AgentPromptResultStub({
        name: 'codeweaver-reviewer',
        prompt: 'You are codeweaver-reviewer.',
      });
      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      proxy.setupAgentPromptReturns({
        agent: 'codeweaver-reviewer',
        questId,
        result: expectedResult,
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'codeweaver-reviewer', questId },
      });

      expect(proxy.getLastAgentPromptCallArgs()).toStrictEqual({
        agent: 'codeweaver-reviewer',
        questId,
      });
      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    it('VALID: {minion agent, questId, no workItemId} => returns served prompt without stamping (minion-fetch)', async () => {
      const proxy = InteractionHandleResponderProxy();
      const expectedResult = AgentPromptResultStub({
        name: 'chaoswhisperer-gap-minion',
        prompt: 'You are chaoswhisperer-gap-minion.',
      });
      const questId = QuestIdStub({ value: '6e8fdc8b-4fb4-4536-bd99-b43b20764932' });
      proxy.setupAgentPromptReturns({
        agent: 'chaoswhisperer-gap-minion',
        questId,
        result: expectedResult,
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-agent-prompt' }),
        args: { agent: 'chaoswhisperer-gap-minion', questId },
      });

      expect(proxy.getLastModifyQuestInput({ questId })).toBe(undefined);
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
      ).rejects.toThrow(/get-agent-prompt requires \{agent, questId\}/u);
    });

    it('ERROR: {missing both questId and workItemId} => throws clear rejection error', async () => {
      const proxy = InteractionHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-agent-prompt' }),
          args: { agent: 'chaoswhisperer-gap-minion' },
        }),
      ).rejects.toThrow(/get-agent-prompt requires \{agent, questId\}/u);
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
