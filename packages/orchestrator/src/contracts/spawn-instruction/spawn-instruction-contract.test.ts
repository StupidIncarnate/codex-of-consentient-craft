import { QuestIdStub, QuestWorkItemIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../prompt-text/prompt-text.stub';
import { spawnInstructionContract } from './spawn-instruction-contract';
import { SpawnInstructionStub } from './spawn-instruction.stub';

describe('spawnInstructionContract', () => {
  describe('valid instructions', () => {
    it('VALID: {full payload with model} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const taskPrompt = PromptTextStub({ value: 'do the work' });

      const result = spawnInstructionContract.parse({
        questId,
        role: 'flowrider',
        workItemId,
        taskPrompt,
        model: 'sonnet',
      });

      expect(result).toStrictEqual({
        questId,
        role: 'flowrider',
        workItemId,
        taskPrompt,
        model: 'sonnet',
      });
    });

    it('VALID: {minimal payload without model} => parses successfully', () => {
      const result = spawnInstructionContract.parse(SpawnInstructionStub());

      expect(result).toStrictEqual({
        questId: 'aaaaaaaa-1111-4222-9333-444444444444',
        role: 'codeweaver',
        workItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
        taskPrompt: 'Call mcp__dungeonmaster__get-agent-prompt(...)',
      });
    });

    it('VALID: {with resumeSessionId and resumePrompt} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const taskPrompt = PromptTextStub({
        value: 'Call mcp__dungeonmaster__get-agent-prompt(...)',
      });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const resumePrompt = PromptTextStub({
        value: 'You already have context; finish and signal back.',
      });

      const result = spawnInstructionContract.parse({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt,
        resumeSessionId,
        resumePrompt,
      });

      expect(result).toStrictEqual({
        questId,
        role: 'codeweaver',
        workItemId,
        taskPrompt,
        resumeSessionId,
        resumePrompt,
      });
    });
  });

  describe('invalid instructions', () => {
    it('INVALID: {missing questId} => throws Required', () => {
      expect(() =>
        spawnInstructionContract.parse({
          role: 'codeweaver',
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
          taskPrompt: PromptTextStub({ value: 'work' }),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing workItemId} => throws Required', () => {
      expect(() =>
        spawnInstructionContract.parse({
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          role: 'codeweaver',
          taskPrompt: PromptTextStub({ value: 'work' }),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing taskPrompt} => throws Required', () => {
      expect(() =>
        spawnInstructionContract.parse({
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          role: 'codeweaver',
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {unknown role} => throws enum error', () => {
      expect(() =>
        spawnInstructionContract.parse({
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          role: 'not-a-role',
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
          taskPrompt: PromptTextStub({ value: 'work' }),
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {unknown model} => throws enum error', () => {
      expect(() =>
        spawnInstructionContract.parse({
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          role: 'codeweaver',
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
          taskPrompt: PromptTextStub({ value: 'work' }),
          model: 'gpt',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
