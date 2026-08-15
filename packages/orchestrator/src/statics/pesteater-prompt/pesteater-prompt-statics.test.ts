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

  describe('Gate 1 reads the one-flow-per-bug spec shape', () => {
    it('VALID: template => Gate 1 reads ONE FLOW PER BUG forking at its last shared node', () => {
      const needle =
        '- **flows** — **ONE FLOW PER BUG**. Each is the reproduction path, forking at its last shared node\n  (two outgoing edges, labelled `today` and `after fix`) into TWO terminal nodes whose LABELS are\n  the actual/expected indicator:';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    // The ACTUAL/EXPECTED prefixes are a LABEL convention — `flowNodeContract` has no field for
    // them — so this prompt must name the same two strings BugHunt writes, or PestEater reads a
    // spec whose invariant it cannot locate.
    it('VALID: template => names the ACTUAL terminal as the repro target carrying no observables', () => {
      const needle =
        '  - the node labelled `ACTUAL: …` is the symptom as it behaves today — your repro target. It\n    carries no observables by design; asserting it would be asserting the bug.';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => names the EXPECTED observables as the invariants the failing tests assert', () => {
      const needle =
        '  - the node labelled `EXPECTED: …` is the behavior your fix must make real. **Its observables,\n    plus any on nodes between the entry point and the fork, are the invariants your failing tests\n    assert**';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => tells PestEater to start its trace at the fork, not the entry point', () => {
      const needle =
        "  - the fork node itself names the divergence — the step where today's behavior stops matching the\n    correct one. Start your root-cause trace there, not at the entry point.";
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    // The bug-hunt `startImplementationOps` seed carries no `fanOutBy`, so ONE PestEater session
    // owns every flow the quest holds — collapsing several bugs into one repro would drop tests.
    it('VALID: template => treats a multi-flow quest as multiple bugs, none collapsed', () => {
      const needle =
        '  More than one flow means more than one bug in this report: each is its own repro, its own fork,\n  and its own set of failing tests. Do not collapse them.';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => no longer reads a mirrored actual-state/expected-state flow pair', () => {
      const { template } = pesteaterPromptStatics.prompt;

      expect(template.indexOf('two flows')).toBe(-1);
      expect(template.indexOf('actual-state flow')).toBe(-1);
      expect(template.indexOf('expected-state flow')).toBe(-1);
    });
  });

  describe('Gate 3 writes one test per EXPECTED observable', () => {
    it('VALID: template => asserts each observable description, one test each', () => {
      const needle =
        "Write (or strengthen) a test per `EXPECTED:` observable from Gate 1 — asserting that observable's\n`description`, never an intermediate cause. Intake split those observables precisely so each one\nis independently testable, so do not fold several into one test.";
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => derives the e2e repro walk from entryPoint to the ACTUAL terminal', () => {
      const needle =
        'The e2e walk that reproduces one flow is the walk from its `entryPoint` to its `ACTUAL:`\nterminal — driving those steps is how you watch the assertion go red for the right reason.';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    // BugHunt tags each observable with an outcome type precisely so the layer is decided at
    // intake rather than re-guessed here; `ui-state` is the one that means Playwright.
    it('VALID: template => picks the test layer from the observable type tag', () => {
      const needle = "The observable's `type` picks the\nlayer, and the symptom shape confirms it:";
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => routes ui-state and browser-observed api-call to Playwright', () => {
      const needle =
        '- `ui-state` (or an `api-call` the user only observes through the browser) / UI element missing / wrong content → e2e (Playwright)';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => routes every other observable type to unit or integration', () => {
      const needle =
        '- Every other `type`, or a transformer/contract you can drive directly → a unit or integration test alongside the implementation.';
      const { template } = pesteaterPromptStatics.prompt;
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });
  });

  it('VALID: template => keeps the failing-test-before-fix TDD discipline', () => {
    expect(pesteaterPromptStatics.prompt.template).toMatch(
      /^1\. \*\*Failing test before fix\*\* — non-negotiable; watch it fail on unchanged source\.$/mu,
    );
  });

  it('VALID: template => resolves the UI package from packageType, as a set, never from the diff', () => {
    const needle =
      "e2e (Playwright) colocated in the entry flow's folder of the UI package: `<ui-package>/src/flows/**/*.e2e.ts`. Resolve `<ui-package>` from `packagesAffected`: the UI packages are EVERY entry whose `packageType` is `frontend-react` or `frontend-ink`, and that `location` is the path to write under. Treat it as a SET — a repo may have several, and when it does, pick the one carrying the flow you are reproducing rather than assuming there is only one.";
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
