import { glyphsmithPromptStatics } from './glyphsmith-prompt-statics';

describe('glyphsmithPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(glyphsmithPromptStatics).toStrictEqual({
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
