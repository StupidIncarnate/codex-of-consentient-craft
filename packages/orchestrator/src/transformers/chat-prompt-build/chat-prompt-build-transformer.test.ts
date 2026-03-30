import { QuestIdStub, SessionIdStub, WorkItemRoleStub } from '@dungeonmaster/shared/contracts';
import { chaoswhispererPromptStatics } from '../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { glyphsmithPromptStatics } from '../../statics/glyphsmith-prompt/glyphsmith-prompt-statics';
import { chatPromptBuildTransformer } from './chat-prompt-build-transformer';
import { chatPromptBuildTransformerProxy } from './chat-prompt-build-transformer.proxy';

describe('chatPromptBuildTransformer', () => {
  describe('chaoswhisperer role', () => {
    it('VALID: {chaoswhisperer + message + questId} => returns prompt with chaoswhisperer template', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const questId = QuestIdStub({ value: 'abc-123' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Build auth',
        questId,
      });

      const expected = chaoswhispererPromptStatics.prompt.template
        .replace(chaoswhispererPromptStatics.prompt.placeholders.arguments, 'Build auth')
        .replace(chaoswhispererPromptStatics.prompt.placeholders.questId, 'abc-123');

      expect(result).toBe(expected);
    });

    it('VALID: {chaoswhisperer + sessionId} => returns raw message as prompt', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const sessionId = SessionIdStub({ value: 'session-123' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Continue working',
        questId: null,
        sessionId,
      });

      expect(result).toBe('Continue working');
    });

    it('VALID: {chaoswhisperer + no questId} => returns template without quest ID replaced', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Build auth',
        questId: null,
      });

      const expected = chaoswhispererPromptStatics.prompt.template.replace(
        chaoswhispererPromptStatics.prompt.placeholders.arguments,
        'Build auth',
      );

      expect(result).toBe(expected);
    });
  });

  describe('glyphsmith role', () => {
    it('VALID: {glyphsmith + message + questId} => returns prompt with glyphsmith template', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest-456' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Create login page',
        questId,
      });

      const expected = glyphsmithPromptStatics.prompt.template
        .replace(glyphsmithPromptStatics.prompt.placeholders.arguments, 'Create login page')
        .replace(glyphsmithPromptStatics.prompt.placeholders.questId, 'design-quest-456');

      expect(result).toBe(expected);
    });

    it('VALID: {glyphsmith + sessionId} => returns raw message as prompt', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });
      const sessionId = SessionIdStub({ value: 'session-456' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Continue design',
        questId: null,
        sessionId,
      });

      expect(result).toBe('Continue design');
    });

    it('VALID: {glyphsmith + no questId} => returns template without quest ID replaced', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'glyphsmith' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Create login page',
        questId: null,
      });

      const expected = glyphsmithPromptStatics.prompt.template.replace(
        glyphsmithPromptStatics.prompt.placeholders.arguments,
        'Create login page',
      );

      expect(result).toBe(expected);
    });
  });
});
