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

  it('VALID: template => Gate 1 reads the actual-state and expected-state flows', () => {
    const needle =
      '- **flows** — two flows: the **actual-state flow** (the reproduction path, ending at the\n  observed symptom) and the **expected-state flow**';
    const { template } = pesteaterPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: template => failed signal routes a code failure to a spiritmender fix + PestEater re-run', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^If you hit a CODE FAILURE — you cannot land a working fix in your own scope \(the real fix exceeds what's safe to change here, or ward will not go green\) — signal `failed`; the orchestrator splices a spiritmender to fix the code, then re-runs PestEater:$/mu,
    );
  });

  it('VALID: template => failed-replan signal routes a plan hole to a PathSeeker replan', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^If you hit a PLAN HOLE — you cannot reproduce the bug as described, or the root cause shows the expected-state flow's observable is not the correct fixed behavior — signal `failed-replan`; PathSeeker re-plans the flows\/observable so the next PestEater run has a correct target:$/mu,
    );
  });

  it('VALID: template => signal-back failed-replan literal appears with REPLAN NEEDED summary shape', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ signal: 'failed-replan', summary: 'REPLAN NEEDED: \[what the plan gets wrong\]\\nOBSERVED: \[what you actually found\]\\nEXPECTED PER PLAN: \[what the quest says should happen\]' \}\)$/mu,
    );
  });

  it('VALID: template => neither failed nor failed-replan is described as blocking the quest', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^A test that can't reproduce the bug is a signal, not a license to skip to the fix — surface it: `failed-replan` when the repro itself contradicts the bug report, `failed` when the repro is right but you cannot land a working fix\. Neither signal blocks the quest — both route to a fixer\.$/mu,
    );
  });

  it('VALID: template => Rules section states code problem => failed, plan problem => failed-replan', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^6\. \*\*Code problem → `failed`; plan problem → `failed-replan`\*\* — a spiritmender fixes what you signal `failed`, PathSeeker re-plans what you signal `failed-replan`; never force a fix that fights the plan, correct the plan instead\.$/mu,
    );
  });
});
