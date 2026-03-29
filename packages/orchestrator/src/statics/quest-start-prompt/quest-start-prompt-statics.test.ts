import { questStartPromptStatics } from './quest-start-prompt-statics';

describe('questStartPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(questStartPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
      },
    });
  });
});
