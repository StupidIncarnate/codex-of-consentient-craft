import { flowriderPromptStatics } from './flowrider-prompt-statics';

describe('flowriderPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(flowriderPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(flowriderPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => declares Flowrider as the flow test author, not a reviewer', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^You are NOT a reviewer\. You stand up the primary suite\. Siegemaster runs after you — it manually QAs the flow and gap-fills what your tests miss\. Your job is to give it real coverage to build on\.$/mu,
    );
  });

  it('VALID: template => follows TDD red-test-first discipline', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^## Phase 3: Write the Implementation \+ Test \(TDD\)$/mu,
    );
  });

  it('VALID: template => carries the Playwright webServer block for runtime flows', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^\s*reuseExistingServer: true,$/mu);
  });

  it('VALID: template => has the Flow Context heading', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^## Flow Context$/mu);
  });

  it('VALID: template => carries the $ARGUMENTS placeholder on its own line', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => has the commit-before-signal section', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });
});
