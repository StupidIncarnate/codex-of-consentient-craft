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

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    expect(flowriderPromptStatics.prompt.template.split('$ARGUMENTS').length - 1).toBe(1);
    expect(flowriderPromptStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => frames the role as owning ONE operation item on the ledger', () => {
    const needle = "You own ONE operation item on the quest's operations ledger";
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.** You have no failure signal.';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a verify-against-git gate that trusts git over the ledger', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^## Phase 1: Verify Your Operation Item Against Git \(BLOCKING\)$/mu,
    );

    const needle = '**Trust git\nover the ledger.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => self-scopes across every flow on the immutable spine', () => {
    const needle =
      '3. Load the quest spine: `get-quest` (stage `spec`) for the flows (nodes, edges, observables),\n   contracts, and design decisions. The spine is immutable — it is your acceptance target.\n   Enumerate EVERY flow; that list is your scope.';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares Flowrider as the suite author, not a reviewer', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^You are NOT a reviewer\. You stand up the primary suite\. Siegemaster runs after you — it manually$/mu,
    );
  });

  it('VALID: template => follows TDD red-test-first discipline', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^## Phase 4: Write the Implementation \+ Test \(TDD\)$/mu,
    );
  });

  it('VALID: template => carries the Playwright webServer block fed by the Operation Context dev-server lines', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^\s*reuseExistingServer: true,$/mu);

    const needle = "command: '<Dev Server Command from Operation Context>',";
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has the Operation Context heading', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^## Operation Context$/mu);
  });

  it('VALID: template => has the commit-before-signal section', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: template => declares the commit message the only handoff channel', () => {
    const needle =
      '**The commit message is the ONLY handoff channel — git carries the context, not the ledger.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => signals partial when the pass changed code (fresh session re-verifies)', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu,
    );
  });

  it('VALID: template => signals done when the pass changed nothing', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu,
    );
  });

  it('VALID: template => states convergence is the verdict (fresh pass that changes nothing)', () => {
    const needle =
      '**Convergence IS the verdict: only a fresh pass that changes nothing proves the suite holds.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
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

  it('VALID: template => scopes accountability to every flow graph, fully walked', () => {
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^## Your Unit of Accountability: EVERY Flow Graph, Fully Walked$/mu,
    );
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
      /^## Phase 6: Coverage Self-Audit \(gate — do not signal until this passes\)$/mu,
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
    expect(flowriderPromptStatics.prompt.template).toMatch(
      /^## Forward-Fixing Non-Flow Implementation Gaps$/mu,
    );
  });

  it('VALID: template => carries no legacy signal or planning-model references', () => {
    const { template } = flowriderPromptStatics.prompt;
    const legacyNeedles = [
      'failed-replan',
      "'failed'",
      'PathSeeker',
      'focusFile',
      'Focus Files',
      'replan',
    ];
    const legacyHits = legacyNeedles.filter((needle) => template.includes(needle));

    expect(legacyHits.join(', ')).toBe('');
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
