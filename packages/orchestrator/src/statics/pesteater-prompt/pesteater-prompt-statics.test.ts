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

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(pesteaterPromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(pesteaterPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: title => frames PestEater as a bug hunt relay worker', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^# PestEater - Bug Hunt Relay Worker$/mu,
    );
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.** You have no failure signal.';
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 1 trusts git over the ledger before reading the bug report', () => {
    const needle =
      '**Trust git over the ledger**: run `git log --oneline -15` first — a "pt N:" prefix on\nyour item means a prior session already started this hunt';
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 1 reads the actual-state and expected-state flows', () => {
    const needle =
      '- **flows** — two flows: the **actual-state flow** (the reproduction path, ending at the\n  observed symptom) and the **expected-state flow**';
    const { template } = pesteaterPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
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

  it('VALID: template => has the commit-before-signal section with the handoff doctrine', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);

    const needle =
      '**The commit message is the ONLY handoff channel — git carries the context, not the ledger.**';
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals done when the bug is fixed and verified', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => signals partial with a committed handoff when scope remains', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
    );
  });

  it('VALID: template => an unreproducible bug is a finding recorded in the handoff, signaled partial', () => {
    const needle =
      'If you cannot reproduce the bug as described, that is\na finding, not a dead end';
    const { template } = pesteaterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no legacy signal or planning-model references', () => {
    const { template } = pesteaterPromptStatics.prompt;

    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf("signal: 'failed'")).toBe(-1);
    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('spiritmender')).toBe(-1);
    expect(template.indexOf('replan')).toBe(-1);
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

  it('VALID: template => has the Operation Context heading', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });
});
