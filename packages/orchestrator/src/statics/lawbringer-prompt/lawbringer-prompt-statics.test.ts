import { lawbringerPromptStatics } from './lawbringer-prompt-statics';

describe('lawbringerPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(lawbringerPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: scope section => defers observable satisfaction to Pathseeker Verify Minion', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^- Check if the step satisfies observables — that's the Pathseeker Verify Minion's job$/mu,
    );
  });

  it('VALID: prompt template => does not reference the renamed Pathseeker Quest Review Minion', () => {
    const needle = 'Quest Review Minion';
    const { template } = lawbringerPromptStatics.prompt;

    expect(template.indexOf(needle)).toBe(-1);
  });
});
