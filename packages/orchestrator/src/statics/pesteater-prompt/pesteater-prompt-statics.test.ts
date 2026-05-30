import { pesteaterPromptStatics } from './pesteater-prompt-statics';

describe('pesteaterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pesteaterPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => is a substantial multi-gate prompt', () => {
    expect(pesteaterPromptStatics.prompt.template.length).toBeGreaterThan(500);
  });

  it('VALID: placeholders.arguments => is the $ARGUMENTS token', () => {
    expect(pesteaterPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
  });
});
