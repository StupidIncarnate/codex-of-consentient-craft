import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

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

  it('VALID: template => runs both flow layers scoped, path-agnostic (no hardcoded package)', () => {
    const needle = 'npm run ward -- --only e2e,integration -- <ui-package>/src/flows/<route>';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no .spec.ts references (e2e renamed to .e2e.ts)', () => {
    expect(siegemasterPromptStatics.prompt.template.indexOf('.spec.ts')).toBe(-1);
  });

  it('VALID: template => leads with operating rules read first', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^## Operating Rules — READ FIRST \(ignoring these wedges the whole quest\)$/mu,
    );
  });

  it('VALID: template => forbids ending the turn waiting for a background task', () => {
    const needle = 'NEVER end your turn waiting for a background task.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids the full monorepo ward for runtime/UI flows', () => {
    const needle = 'NOT the full monorepo `npm run ward`';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => defines manual QA as driving the real browser via the Claude-in-Chrome MCP', () => {
    const needle = 'drive the actual browser via the **Claude-in-Chrome MCP**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => hardcodes no UI package path', () => {
    expect(siegemasterPromptStatics.prompt.template.indexOf('packages/web')).toBe(-1);
  });
});
