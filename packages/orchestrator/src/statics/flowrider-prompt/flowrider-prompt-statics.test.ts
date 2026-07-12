import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

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

  it('VALID: template => declares e2e Playwright-exclusive colocation in the UI package', () => {
    const needle =
      "**e2e = Playwright exclusively, and each `.e2e.ts` colocates with the UI it tests.** An e2e lives in the entry flow's folder of the UI package";
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => runs both flow layers scoped, path-agnostic (no hardcoded package)', () => {
    const needle = 'npm run ward -- --only e2e,integration -- <ui-package>/src/flows/<route>';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no .spec.ts references (e2e renamed to .e2e.ts)', () => {
    expect(flowriderPromptStatics.prompt.template.indexOf('.spec.ts')).toBe(-1);
  });

  it('VALID: template => scopes accountability to the whole flow graph, not the step assertions', () => {
    const needle =
      "## Your Unit of Accountability: the WHOLE Flow Graph (not your step's assertions)";
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => makes the error/failure terminal a first-class, non-optional path', () => {
    const needle =
      'An `error-toast` / `4xx` / rejection terminal is a first-class path, never optional.';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has the coverage self-audit gate before signaling', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^## Phase 5: Coverage Self-Audit \(gate — do not signal until this passes\)$/mu,
    );
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => hardcodes no UI package path', () => {
    expect(flowriderPromptStatics.prompt.template.indexOf('packages/web')).toBe(-1);
  });

  it('VALID: template => licenses forward-fixing genuine non-flow integration gaps', () => {
    const needle = '## Forward-Fixing Non-Flow Implementation Gaps';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids signaling for a fixable seam; forward-fix instead', () => {
    const needle =
      'Do NOT signal for a fixable seam — fix it forward and move on; a genuine, fixable gap is not a wall.';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => routes an unfixable code failure to failed, spiritmender fixes and re-runs', () => {
    const needle =
      'an unfixable code failure is `failed` (a spiritmender fixes it, you re-run), and missing glue, a wrong contract, or a structural gap the plan never accounted for is `failed-replan` (PathSeeker fixes the plan).';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => neither failed nor failed-replan blocks the quest', () => {
    const needle =
      'Neither signal blocks the quest: `failed` routes to a spiritmender that fixes the code and hands the flow back to you to re-run; `failed-replan` routes to PathSeeker to fix the plan.';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => cautions that Explore agents do not reliably audit line-level semantics', () => {
    const needle =
      'an `Explore` agent finds files and usages but does NOT reliably audit line-level semantics';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
