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

  describe('ask-user-question', () => {
    it('VALID: {questions} => returns instruction text', async () => {
      const proxy = InteractionHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'ask-user-question' }),
        args: {
          questions: [
            {
              question: 'Which option?',
              header: 'Choice',
              options: [{ label: 'A', description: 'Option A' }],
              multiSelect: false,
            },
          ],
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
