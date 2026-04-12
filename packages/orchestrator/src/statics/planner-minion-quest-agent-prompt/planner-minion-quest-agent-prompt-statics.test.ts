import { plannerMinionQuestAgentPromptStatics } from './planner-minion-quest-agent-prompt-statics';

describe('plannerMinionQuestAgentPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(plannerMinionQuestAgentPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
