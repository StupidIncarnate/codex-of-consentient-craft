import { spiritmenderPromptStatics } from './spiritmender-prompt-statics';

describe('spiritmenderPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(spiritmenderPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
