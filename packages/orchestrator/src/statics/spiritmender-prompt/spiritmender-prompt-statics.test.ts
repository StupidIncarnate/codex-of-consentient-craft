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

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });

  it('VALID: prompt template => keeps the anti-cheating guardrails (Do NOT section)', () => {
    expect(spiritmenderPromptStatics.prompt.template).toMatch(/^\*\*Do NOT:\*\*$/mu);
  });
});
