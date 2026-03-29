import { chaoswhispererPromptStatics } from './chaoswhisperer-prompt-statics';

describe('chaoswhispererPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(chaoswhispererPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
          questId: '$QUEST_ID',
        },
      },
    });
  });
});
