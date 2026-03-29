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

      expect(result).toContain('ChaosWhisperer');
      expect(result).toContain('Build auth');
      expect(result).toContain('abc-123');
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

      expect(result).toContain('ChaosWhisperer');
      expect(result).toContain('Build auth');
      expect(result).toMatch(
        new RegExp(
          chaoswhispererPromptStatics.prompt.placeholders.questId.replace('$', '\\$'),
          'u',
        ),
      );
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

      expect(result).toContain('Glyphsmith');
      expect(result).toContain('Create login page');
      expect(result).toContain('design-quest-456');
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

      expect(result).toContain('Glyphsmith');
      expect(result).toContain('Create login page');
      expect(result).toMatch(
        new RegExp(glyphsmithPromptStatics.prompt.placeholders.questId.replace('$', '\\$'), 'u'),
      );
    });
  });
});
