/**
 * PURPOSE: Tests for pathseeker prompt statics
 */

import { pathseekerPromptStatics } from './pathseeker-prompt-statics';

describe('pathseekerPromptStatics', () => {
  describe('prompt', () => {
    it('has template property', () => {
      expect(pathseekerPromptStatics.prompt.template).toBeDefined();
      expect(typeof pathseekerPromptStatics.prompt.template).toBe('string');
    });

    it('template includes $ARGUMENTS placeholder', () => {
      const hasPlaceholder = pathseekerPromptStatics.prompt.template.includes('$ARGUMENTS');

      expect(hasPlaceholder).toBe(true);
    });

    it('has placeholders property', () => {
      expect(pathseekerPromptStatics.prompt.placeholders).toBeDefined();
      expect(pathseekerPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    it('template includes quest creation mode instructions', () => {
      const hasQuestCreation = pathseekerPromptStatics.prompt.template.includes('Quest Creation');
      const hasObservableActions =
        pathseekerPromptStatics.prompt.template.includes('Observable Actions');

      expect(hasQuestCreation).toBe(true);
      expect(hasObservableActions).toBe(true);
    });

    it('template includes MCP add-quest tool instructions', () => {
      const hasAddQuest = pathseekerPromptStatics.prompt.template.includes('add-quest');
      const hasOutputInstructions =
        pathseekerPromptStatics.prompt.template.includes('Output Instructions');

      expect(hasAddQuest).toBe(true);
      expect(hasOutputInstructions).toBe(true);
    });

    it('template includes task definition criteria', () => {
      const hasTaskTypes = pathseekerPromptStatics.prompt.template.includes('Task Types');
      const hasImplementation = pathseekerPromptStatics.prompt.template.includes('implementation');
      const hasTesting = pathseekerPromptStatics.prompt.template.includes('testing');

      expect(hasTaskTypes).toBe(true);
      expect(hasImplementation).toBe(true);
      expect(hasTesting).toBe(true);
    });

    it('template includes exploration guidelines', () => {
      const hasExplorationGuidelines =
        pathseekerPromptStatics.prompt.template.includes('Exploration Guidelines');
      const hasIntegrationAnalysis =
        pathseekerPromptStatics.prompt.template.includes('Integration Analysis');

      expect(hasExplorationGuidelines).toBe(true);
      expect(hasIntegrationAnalysis).toBe(true);
    });
  });
});
