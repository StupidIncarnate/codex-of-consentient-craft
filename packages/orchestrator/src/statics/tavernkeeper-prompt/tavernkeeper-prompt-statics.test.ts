import { tavernkeeperPromptStatics } from './tavernkeeper-prompt-statics';

const { template, placeholders } = tavernkeeperPromptStatics.prompt;
const TEMPLATE_LINES = template.split('\n');

describe('tavernkeeperPromptStatics', () => {
  describe('placeholders', () => {
    it('VALID: prompt.placeholders => the two tokens the follow-up responder interpolates', () => {
      expect(placeholders).toStrictEqual({
        arguments: '$ARGUMENTS',
        questId: '$QUEST_ID',
      });
    });
  });

  describe('template identity', () => {
    it('VALID: template => opens with the Tavernkeeper heading', () => {
      expect(TEMPLATE_LINES[0]).toBe('# Tavernkeeper - Follow-Up Chat');
    });

    it('VALID: template => interpolates the quest id exactly once', () => {
      expect(template.split('$QUEST_ID').length - 1).toBe(1);
    });
  });

  describe('question-last ordering', () => {
    it('VALID: template => ends with the user question, so the question is read before any tool call', () => {
      expect(TEMPLATE_LINES[TEMPLATE_LINES.length - 1]).toBe('$ARGUMENTS');
    });

    it('VALID: template => carries the user question exactly once, so no earlier copy precedes the protocol', () => {
      expect(template.split('$ARGUMENTS').length - 1).toBe(1);
    });
  });

  describe('powers withheld', () => {
    it('VALID: template => forbids writing the quest status', () => {
      const line = TEMPLATE_LINES.find((candidate) =>
        candidate.startsWith('- NEVER call `modify-quest`'),
      );

      expect(line).toBe(
        "- NEVER call `modify-quest` with a `status` — this quest's status is not yours to change",
      );
    });

    it('VALID: template => tells the agent it owns no ledger entry to signal on', () => {
      const line = TEMPLATE_LINES.find((candidate) => candidate.startsWith('- Call `signal-back`'));

      expect(line).toBe('- Call `signal-back` — it owns no operation item and no ledger entry');
    });
  });
});
