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

  it('VALID: focus section => defers observable / flow-walk coverage to PathSeeker', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^- Post-implementation rule compliance is your job\. Business-logic correctness is siegemaster's, and observable \/ flow-walk coverage is PathSeeker's — don't re-litigate those\. But if you spot a clear bug while reviewing, fix it\.$/mu,
    );
  });

  it('VALID: prompt template => is a fixer, not read-only (no read-only framing remains)', () => {
    expect(lawbringerPromptStatics.prompt.template.indexOf('read-only')).toBe(-1);
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => documents the whole-diff bug-hunt review mode', () => {
    expect(lawbringerPromptStatics.prompt.template).toMatch(/^## Review Mode$/mu);
  });

  it('VALID: prompt template => does not reference removed verify-minion roles', () => {
    const { template } = lawbringerPromptStatics.prompt;

    expect(template.indexOf('Verify Minion')).toBe(-1);
    expect(template.indexOf('Quest Review Minion')).toBe(-1);
  });
});
