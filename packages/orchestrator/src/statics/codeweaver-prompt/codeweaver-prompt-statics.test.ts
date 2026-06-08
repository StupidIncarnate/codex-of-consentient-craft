import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

describe('codeweaverPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(codeweaverPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: prompt template => declares unit-tests-only scope (no integration/e2e, no flows/startup)', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^\*\*Unit tests only\.\*\* You write `\.test\.ts` unit tests for your focusFiles\. You do NOT write$/mu,
    );
  });

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });
});
