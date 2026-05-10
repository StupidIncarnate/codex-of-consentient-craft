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

  it("VALID: scope section => defers observable satisfaction to PathSeeker's seek_walk flow walk", () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^- Check if the step satisfies observables — observable checking during seek_walk is PathSeeker's flow-walk responsibility; Lawbringer's job is post-implementation rule compliance only$/mu,
    );
  });

  it('VALID: prompt template => does not reference removed verify-minion roles', () => {
    const { template } = lawbringerPromptStatics.prompt;

    expect(template.indexOf('Verify Minion')).toBe(-1);
    expect(template.indexOf('Quest Review Minion')).toBe(-1);
  });
});
