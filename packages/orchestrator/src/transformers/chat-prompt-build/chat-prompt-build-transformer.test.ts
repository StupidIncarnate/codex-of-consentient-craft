import { QuestIdStub, SessionIdStub, WorkItemRoleStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { dumpsterCreatePromptStatics } from '../../statics/dumpster-create-prompt/dumpster-create-prompt-statics';
import { glyphsmithPromptStatics } from '../../statics/glyphsmith-prompt/glyphsmith-prompt-statics';
import { tavernkeeperPromptStatics } from '../../statics/tavernkeeper-prompt/tavernkeeper-prompt-statics';
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

      const expected = dumpsterCreatePromptStatics.prompt.template
        .replace(dumpsterCreatePromptStatics.prompt.placeholders.arguments, 'Build auth')
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
          dumpsterCreatePromptStatics.questBootstrap.preCreated,
        )
        .split(dumpsterCreatePromptStatics.prompt.placeholders.questId)
        .join('abc-123')
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
          dumpsterCreatePromptStatics.clarifyInstructions.mcp,
        );

      expect(result).toBe(expected);
    });

    it('VALID: {chaoswhisperer + questId} => embeds the pre-created questId and does NOT tell the agent to mint a new quest', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const questId = QuestIdStub({ value: 'abc-123' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Build auth',
        questId,
      });

      const idIndex = result.indexOf('abc-123');

      expect(result.slice(idIndex, idIndex + 'abc-123'.length)).toBe('abc-123');
      expect(
        result.indexOf('call `mcp__dungeonmaster__create-quest` to create the new quest'),
      ).toBe(-1);
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

    it('VALID: {chaoswhisperer + no questId} => uses the mint bootstrap with no quest ID to fill', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Build auth',
        questId: null,
      });

      const expected = dumpsterCreatePromptStatics.prompt.template
        .replace(dumpsterCreatePromptStatics.prompt.placeholders.arguments, 'Build auth')
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
          dumpsterCreatePromptStatics.questBootstrap.mint,
        )
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
          dumpsterCreatePromptStatics.clarifyInstructions.mcp,
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

  describe('tavernkeeper role', () => {
    it('VALID: {tavernkeeper + message + questId} => returns prompt with tavernkeeper template', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const questId = QuestIdStub({ value: 'followup-quest-789' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Can you nudge this button color?',
        questId,
      });

      const expected = tavernkeeperPromptStatics.prompt.template
        .replace(
          tavernkeeperPromptStatics.prompt.placeholders.arguments,
          'Can you nudge this button color?',
        )
        .replace(tavernkeeperPromptStatics.prompt.placeholders.questId, 'followup-quest-789');

      expect(result).toBe(expected);
    });

    it('VALID: {tavernkeeper + sessionId} => returns raw message as prompt', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const sessionId = SessionIdStub({ value: 'session-789' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Continue the follow-up',
        questId: null,
        sessionId,
      });

      expect(result).toBe('Continue the follow-up');
    });

    it('VALID: {tavernkeeper} => builds from the tavernkeeper template, not the glyphsmith template', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const questId = QuestIdStub({ value: 'followup-quest-789' });

      const result = chatPromptBuildTransformer({
        role,
        message: 'Can you nudge this button color?',
        questId,
      });

      const tavernkeeperExpected = tavernkeeperPromptStatics.prompt.template
        .replace(
          tavernkeeperPromptStatics.prompt.placeholders.arguments,
          'Can you nudge this button color?',
        )
        .replace(tavernkeeperPromptStatics.prompt.placeholders.questId, 'followup-quest-789');
      const glyphsmithExpected = glyphsmithPromptStatics.prompt.template
        .replace(
          glyphsmithPromptStatics.prompt.placeholders.arguments,
          'Can you nudge this button color?',
        )
        .replace(glyphsmithPromptStatics.prompt.placeholders.questId, 'followup-quest-789');

      const matchesGlyphsmithTemplate = result === glyphsmithExpected;

      expect(result).toBe(tavernkeeperExpected);
      expect(matchesGlyphsmithTemplate).toBe(false);
    });
  });

  describe('non-chat role', () => {
    it('ERROR: {codeweaver} => throws naming the role', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'codeweaver' });

      expect(() =>
        chatPromptBuildTransformer({
          role,
          message: 'Implement the feature',
          questId: QuestIdStub(),
        }),
      ).toThrow(/^chatPromptBuildTransformer has no template for role 'codeweaver'.*$/u);
    });
  });

  describe('pasted-image trailer', () => {
    const imagePath = '/home/u/.dungeonmaster/guilds/g/quests/q/images/2f1c.png';
    const message = `this one ![Pasted Image 1](${imagePath}) is what I want`;

    it('VALID: {tavernkeeper + sessionId + message carrying one image token} => prompt is the raw message followed by the sentinel line and the instruction line', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const sessionId = SessionIdStub({ value: 'session-img-1' });

      const result = chatPromptBuildTransformer({
        role,
        message,
        questId: null,
        sessionId,
      });

      expect(result).toBe(
        `${message}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
      );
    });

    it('VALID: {chaoswhisperer + questId + message carrying one image token} => the template expansion followed by the same trailer', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const questId = QuestIdStub({ value: 'img-quest-1' });

      const result = chatPromptBuildTransformer({
        role,
        message,
        questId,
      });

      const expected = dumpsterCreatePromptStatics.prompt.template
        .replace(dumpsterCreatePromptStatics.prompt.placeholders.arguments, message)
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
          dumpsterCreatePromptStatics.questBootstrap.preCreated,
        )
        .split(dumpsterCreatePromptStatics.prompt.placeholders.questId)
        .join('img-quest-1')
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
          dumpsterCreatePromptStatics.clarifyInstructions.mcp,
        );

      expect(result).toBe(
        `${expected}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
      );
    });

    it('VALID: {message carrying TWO image tokens} => the sentinel appears exactly once', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const sessionId = SessionIdStub({ value: 'session-img-2' });
      const imagePath2 = '/home/u/.dungeonmaster/guilds/g/quests/q/images/9ab0.png';
      const twoTokenMessage = `compare ![Pasted Image 1](${imagePath}) with ![Pasted Image 2](${imagePath2})`;

      const result = chatPromptBuildTransformer({
        role,
        message: twoTokenMessage,
        questId: null,
        sessionId,
      });

      const sentinelCount = result.split(pastedImageStatics.promptSentinel).length - 1;

      expect(sentinelCount).toBe(1);
      expect(result).toBe(
        `${twoTokenMessage}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
      );
    });

    it('VALID: {tavernkeeper + sessionId + message with NO image token} => no sentinel anywhere', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const sessionId = SessionIdStub({ value: 'session-no-img' });
      const plainMessage = 'just run the ward and report back';

      const result = chatPromptBuildTransformer({
        role,
        message: plainMessage,
        questId: null,
        sessionId,
      });

      expect(result.indexOf(pastedImageStatics.promptSentinel)).toBe(-1);
      expect(result).toBe(plainMessage);
    });

    it('VALID: {chaoswhisperer + questId + message with NO image token} => no sentinel anywhere, expected built from the statics replacements', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'chaoswhisperer' });
      const questId = QuestIdStub({ value: 'no-img-quest' });
      const plainMessage = 'Build auth';

      const result = chatPromptBuildTransformer({
        role,
        message: plainMessage,
        questId,
      });

      const expected = dumpsterCreatePromptStatics.prompt.template
        .replace(dumpsterCreatePromptStatics.prompt.placeholders.arguments, plainMessage)
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
          dumpsterCreatePromptStatics.questBootstrap.preCreated,
        )
        .split(dumpsterCreatePromptStatics.prompt.placeholders.questId)
        .join('no-img-quest')
        .replace(
          dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
          dumpsterCreatePromptStatics.clarifyInstructions.mcp,
        );

      expect(result.indexOf(pastedImageStatics.promptSentinel)).toBe(-1);
      expect(result).toBe(expected);
    });

    it('EDGE: {message holding only the bare placeholder, no ! and no path} => no sentinel', () => {
      chatPromptBuildTransformerProxy();
      const role = WorkItemRoleStub({ value: 'tavernkeeper' });
      const sessionId = SessionIdStub({ value: 'session-bare-placeholder' });
      const bareMessage = '[Pasted Image 1]';

      const result = chatPromptBuildTransformer({
        role,
        message: bareMessage,
        questId: null,
        sessionId,
      });

      expect(result.indexOf(pastedImageStatics.promptSentinel)).toBe(-1);
      expect(result).toBe(bareMessage);
    });
  });
});
