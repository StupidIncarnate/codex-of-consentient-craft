import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { flowriderPromptStatics } from './flowrider-prompt-statics';

describe('flowriderPromptStatics', () => {
  it('VALID: template => traces each flow across every layer before picking a modality', () => {
    const needle = '## Phase 3: Trace Each Flow Through Every Layer, Then Pick Modalities';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('**A flow is not one technology.**')).toBeGreaterThan(-1);
    expect(template.indexOf('**Then pick a modality PER LAYER, not per flow.**')).toBeGreaterThan(
      -1,
    );
  });

  it('VALID: template => forbids stopping at Playwright when a flow reaches the server', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect(
      template.indexOf('**Playwright can only prove what the browser can observe.**'),
    ).toBeGreaterThan(-1);
    expect(template.indexOf('do NOT stop at Playwright when a flow goes deeper')).toBeGreaterThan(
      -1,
    );
    expect(
      template.indexOf('**This is required even when the flow also has a UI**'),
    ).toBeGreaterThan(-1);
  });

  it('VALID: template => operational flows are verified, never given a test suite', () => {
    const needle = '**You author no test suite here.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('**Modality: VERIFICATION, not a test suite.**')).toBeGreaterThan(-1);
  });

  it('VALID: template => the coverage gate audits per-layer coverage, not just per-flow', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect(template.indexOf('2. **Layers** —')).toBeGreaterThan(-1);
    expect(
      template.indexOf(
        'whose browser walk is green but whose server layer has no assertion is NOT covered',
      ),
    ).toBeGreaterThan(-1);
  });

  it('VALID: template => extends the tests Codeweaver already wrote instead of starting from empty', () => {
    const needle = '**You are not starting from an empty test tree.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('prefer EXTENDING it over replacing it')).toBeGreaterThan(-1);
    expect(template.indexOf('Playwright `.e2e.ts` — no other role writes it')).toBeGreaterThan(-1);
  });

  it('VALID: template => reads observables as they stand now, including ones a session added', () => {
    const needle = '**Read the observables as they stand NOW, not as they were authored.**';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('an added one is exactly the coverage a prior')).toBeGreaterThan(-1);
  });

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

  it('VALID: template => self-scopes across every flow on the user-approved flow graph', () => {
    const needle =
      '3. Load the quest spine: `get-quest` (stage `spec`) for the flows (nodes, edges, observables),\n   contracts, and design decisions. The FLOW GRAPH is the user-approved acceptance target and does\n   not move. Enumerate EVERY flow; that list is your scope.';
    const { template } = flowriderPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares Flowrider a test writer that writes no implementation', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect(template).toMatch(
      /^\*\*You are a TEST WRITER\. You write no implementation\.\*\* Codeweaver builds every implementation file$/mu,
    );
    expect(template.indexOf('**Integration review.**')).toBeGreaterThan(-1);
    expect(template.indexOf('**E2E authoring.**')).toBeGreaterThan(-1);
  });

  it('VALID: template => follows TDD red-test-first discipline without authoring implementation', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect(template).toMatch(
      /^## Phase 4: Extend the Integration Coverage, Author the E2E \(TDD\)$/mu,
    );
    expect(
      template.indexOf('**You do not write implementation to make a test pass.**'),
    ).toBeGreaterThan(-1);
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

  it('VALID: template => reports an exposed implementation gap instead of fixing or hiding it', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect(template).toMatch(/^## When a Test Exposes an Implementation Gap$/mu);
    expect(template.indexOf('**Never weaken or skip the test to make it pass.**')).toBeGreaterThan(
      -1,
    );
    expect(template.indexOf('**Never write the implementation yourself.**')).toBeGreaterThan(-1);
    // The old doctrine made Flowrider forward-fix implementation; Codeweaver owns that now.
    expect(template.indexOf('## Forward-Fixing Non-Flow Implementation Gaps')).toBe(-1);
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
