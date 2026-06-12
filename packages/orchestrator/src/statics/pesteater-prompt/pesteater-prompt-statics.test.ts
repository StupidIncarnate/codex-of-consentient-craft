import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

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

  it('VALID: template => has the commit-before-signal section', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^\*\*Hard rule — DO NOT STASH\.\*\*$/mu,
    );
  });

  it('VALID: template => keeps the failing-test-before-fix TDD discipline', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^1\. \*\*Failing test before fix\*\* — non-negotiable; watch it fail on unchanged source\.$/mu,
    );
  });

  it('VALID: template => points UI-symptom e2e tests at colocated web flow .e2e.ts files', () => {
    const needle =
      "- UI element missing / wrong content → e2e (Playwright) colocated in the entry flow's folder of the UI package: `<ui-package>/src/flows/**/*.e2e.ts` (use the actual package from packagesAffected / the diff — a repo may have several UI packages).";
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no .spec.ts references (e2e renamed to .e2e.ts)', () => {
    expect(pesteaterPromptStatics.prompt.template.indexOf('.spec.ts')).toBe(-1);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => hardcodes no UI package path', () => {
    expect(pesteaterPromptStatics.prompt.template.indexOf('packages/web')).toBe(-1);
  });
});
