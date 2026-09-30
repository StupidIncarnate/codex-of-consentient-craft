import { TextContentSchema } from '#gateway/npm/modelcontextprotocol__sdk__types';
import { AgentPromptResultStub } from '@dungeonmaster/shared/contracts/agent-prompt-result/agent-prompt-result.stub';
import { OperationItemIdStub } from '@dungeonmaster/shared/contracts/operation-item-id/operation-item-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { InteractionHandleResponderProxy } from './interaction-handle-responder.proxy';

describe('InteractionHandleResponder', () => {
  describe('signal-back', () => {
    it('VALID: {signal: complete, operationItemId, questId, workItemId} => returns JSON result', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: 'signal-back',
        args: {
          signal: 'complete',
          operationItemId: OperationItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' }),
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('VALID: {signal: complete, blockedReason, questId, workItemId} => returns JSON result', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: 'signal-back',
        args: {
          signal: 'complete',
          blockedReason: 'the CI token this round needs is not on this machine',
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });
  });

  describe('ask-user-question', () => {
    it('VALID: {questions} => returns the wait-or-continue instruction keyed on the caller shape', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: 'ask-user-question',
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
        tool: 'get-agent-prompt',
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
        tool: 'get-agent-prompt',
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

    it('VALID: {minion agent, questId, no workItemId} => returns served prompt (minion-fetch)', async () => {
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
        tool: 'get-agent-prompt',
        args: { agent: 'chaoswhisperer-gap-minion', questId },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(expectedResult, null, 2) }],
      });
    });

    it('ERROR: {missing questId} => throws clear rejection error', async () => {
      const proxy = InteractionHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: 'get-agent-prompt',
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
          tool: 'get-agent-prompt',
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
          tool: 'unknown-tool',
          args: {},
        }),
      ).rejects.toThrow(/Unknown interaction tool/u);
    });
  });
});
