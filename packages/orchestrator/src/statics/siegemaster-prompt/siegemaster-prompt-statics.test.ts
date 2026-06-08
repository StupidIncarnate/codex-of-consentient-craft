import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

describe('siegemasterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => declares bounded authorship (never creates a net-new primary suite file)', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^5\. \*\*Bounded authorship\*\* — you never create a net-new primary e2e\/integration file \(that is Flowrider's job\)\. You only extend existing suites with the specific cases your manual exploration exposed\.$/mu,
    );
  });

  it('VALID: template => verifies the happy path first before trying to break anything', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^This is your first active phase — exploration the automated tests are blind to\. \*\*Confirm the happy path works BEFORE you try to break anything\.\*\*$/mu,
    );
  });

  it('VALID: template => leads with a Manual QA phase that runs the flow for real', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^## Phase 2: Manual QA \(run it for real\)$/mu,
    );
  });

  it('VALID: template => cross-checks tests it did not personally run for false positives', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^## Phase 5: Cross-Check Tests You Didn't Run$/mu,
    );
  });

  it('VALID: template => carries the red-test-before-fix discipline', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^This is the repo's mandatory red-test-before-fix discipline: never change implementation without a test that fails first on the unfixed code\.$/mu,
    );
  });

  it('VALID: template => Signaling section warns against FAILED OBSERVABLES in complete summary', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^\*\*Warning:\*\* Do NOT include the literal string `FAILED OBSERVABLES:` in any complete-signal summary\.$/mu,
    );
  });

  it('VALID: template => failure-summary guidance references Nodes block for observable-id placeholder', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^Use observable IDs from the Nodes block when populating `\{observable-id\}` placeholders\.$/mu,
    );
  });

  it('VALID: template => has the commit-before-signal section', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });
});
