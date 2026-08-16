import { dumpsterHuntPromptStatics } from '../dumpster-hunt-prompt/dumpster-hunt-prompt-statics';
import { pesteaterPromptStatics } from '../pesteater-prompt/pesteater-prompt-statics';
import { disciplineBugReproStatics } from './discipline-bug-repro-statics';

const hasOrchestrator = (needle: string): boolean =>
  disciplineBugReproStatics.orchestratorMarkdown.includes(needle);
const hasPlanner = (needle: string): boolean =>
  disciplineBugReproStatics.plannerMarkdown.includes(needle);
const hasWorker = (needle: string): boolean =>
  disciplineBugReproStatics.workerMarkdown.includes(needle);
const hasReviewer = (needle: string): boolean =>
  disciplineBugReproStatics.reviewerMarkdown.includes(needle);

// The orchestrator block is interpolated into a template that already spends its budget on the loop
// and the tool wall; the three minion blocks are interpolated into templates served whole to a
// sub-agent. A pack over these sizes buys its detail out of the gates that follow it.
const ORCHESTRATOR_BUDGET_CHARS = 2_500;
const MINION_BLOCK_BUDGET_CHARS = 6_500;

// The orchestrator never opens a source file, so naming a standards or search tool in ITS block is
// the one way a pack can re-open the context leak the role exists to close.
const TOOLS_THE_ORCHESTRATOR_MAY_NOT_BE_HANDED = [
  'get-architecture',
  'get-syntax-rules',
  'get-testing-patterns',
  'discover',
  'get-project-map',
  'get-project-inventory',
  'get-folder-detail',
] as const;

// `flowNodeContract` carries id/label/type/packages/observables and has nowhere to put an
// actual-vs-expected flag, so the indicator rides in the node LABEL. Nothing typechecks that the
// prompt writing the label and the prompts reading it agree — this test is the only thing that does.
const MISSPELLED_LABEL_VARIANTS = ['Actual:', 'actual:', 'Expected:', 'expected:'] as const;

describe('disciplineBugReproStatics', () => {
  it('VALID: exported value => carries exactly the four discipline blocks as non-empty strings', () => {
    expect(disciplineBugReproStatics).toStrictEqual({
      orchestratorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  it('VALID: blocks => stay inside their interpolation budgets', () => {
    expect({
      orchestratorWithinBudget:
        disciplineBugReproStatics.orchestratorMarkdown.length <= ORCHESTRATOR_BUDGET_CHARS,
      plannerWithinBudget:
        disciplineBugReproStatics.plannerMarkdown.length <= MINION_BLOCK_BUDGET_CHARS,
      workerWithinBudget:
        disciplineBugReproStatics.workerMarkdown.length <= MINION_BLOCK_BUDGET_CHARS,
      reviewerWithinBudget:
        disciplineBugReproStatics.reviewerMarkdown.length <= MINION_BLOCK_BUDGET_CHARS,
    }).toStrictEqual({
      orchestratorWithinBudget: true,
      plannerWithinBudget: true,
      workerWithinBudget: true,
      reviewerWithinBudget: true,
    });
  });

  it('VALID: orchestratorMarkdown => hands the orchestrator no standards or search tool', () => {
    expect(
      TOOLS_THE_ORCHESTRATOR_MAY_NOT_BE_HANDED.filter((tool) => hasOrchestrator(tool)),
    ).toStrictEqual([]);
  });

  // The `ACTUAL:` / `EXPECTED:` prefixes are a LABEL convention with no contract field behind them.
  // The intake writes them, this pack reads them, and a one-character drift in either direction
  // leaves a session unable to find the invariant it is supposed to assert.
  it('VALID: node-label prefixes => spelled identically in the pack, the intake and the pesteater prompt', () => {
    const pack = [
      disciplineBugReproStatics.orchestratorMarkdown,
      disciplineBugReproStatics.plannerMarkdown,
      disciplineBugReproStatics.workerMarkdown,
      disciplineBugReproStatics.reviewerMarkdown,
    ].join('\n');
    const intake = dumpsterHuntPromptStatics.prompt.template;
    const pesteater = pesteaterPromptStatics.prompt.template;

    expect({
      intake: {
        actual: intake.includes('ACTUAL: '),
        expected: intake.includes('EXPECTED: '),
        edgeToday: intake.includes('`today`'),
        edgeAfterFix: intake.includes('`after fix`'),
      },
      pesteater: {
        actual: pesteater.includes('ACTUAL: '),
        expected: pesteater.includes('EXPECTED: '),
        edgeToday: pesteater.includes('`today`'),
        edgeAfterFix: pesteater.includes('`after fix`'),
      },
      pack: {
        actual: pack.includes('ACTUAL: '),
        expected: pack.includes('EXPECTED: '),
        edgeToday: pack.includes('`today`'),
        edgeAfterFix: pack.includes('`after fix`'),
      },
      packMisspellings: MISSPELLED_LABEL_VARIANTS.filter((variant) => pack.includes(variant)),
    }).toStrictEqual({
      intake: { actual: true, expected: true, edgeToday: true, edgeAfterFix: true },
      pesteater: { actual: true, expected: true, edgeToday: true, edgeAfterFix: true },
      pack: { actual: true, expected: true, edgeToday: true, edgeAfterFix: true },
      packMisspellings: [],
    });
  });

  // Every block reads a spec nobody else on the quest reads for it, so each states the shape itself
  // rather than pointing at a sibling block the session it lands in never sees.
  it('VALID: every block => states the ONE FLOW PER BUG shape and puts observables on EXPECTED only', () => {
    expect({
      orchestrator: {
        oneFlowPerBug: hasOrchestrator('**The spec shape is ONE FLOW PER BUG**'),
        flowCountIsBugCount: hasOrchestrator('the flow count IS the bug count'),
        expectedSideOnly: hasOrchestrator('Observables sit on the EXPECTED side ONLY —'),
        namesWhyNotActual: hasOrchestrator(
          'an observable on the ACTUAL branch would ask for a test that asserts the bug',
        ),
      },
      planner: {
        oneFlowPerBug: hasPlanner('its spec is **ONE FLOW PER BUG**'),
        expectedSideOnly: hasPlanner('Observables sit on the EXPECTED side only; each is a'),
        oneObservableOneTest: hasPlanner('each becomes exactly ONE failing test'),
        forkIsWhereTheTraceStarts: hasPlanner(
          "the step where today's behaviour stops matching the correct one — so a\nroot-cause trace starts THERE, not at the entry point",
        ),
      },
      worker: {
        assertTheObservable: hasWorker(
          "The invariant your piece makes true is an `EXPECTED:` observable your brief quotes verbatim from\nthe quest's bug flow.",
        ),
        neverAnIntermediateCause: hasWorker(
          'never an intermediate\ncause you found on the way to it. One observable, one test.',
        ),
      },
      reviewer: {
        expectedSideOnly: hasReviewer(
          '`EXPECTED: <what the fix must make real>`, and the observables on the EXPECTED terminal — never on\nthe ACTUAL one — are the invariants this round had to make true',
        ),
      },
    }).toStrictEqual({
      orchestrator: {
        oneFlowPerBug: true,
        flowCountIsBugCount: true,
        expectedSideOnly: true,
        namesWhyNotActual: true,
      },
      planner: {
        oneFlowPerBug: true,
        expectedSideOnly: true,
        oneObservableOneTest: true,
        forkIsWhereTheTraceStarts: true,
      },
      worker: { assertTheObservable: true, neverAnIntermediateCause: true },
      reviewer: { expectedSideOnly: true },
    });
  });

  // The seed carries no `fanOutBy`, so nothing upstream partitioned the bugs and nothing downstream
  // picks up the one that got skimmed.
  it('VALID: orchestratorMarkdown => owns every bug flow, names its denominator, and is the last line', () => {
    expect({
      oneItemEveryBug: hasOrchestrator(
        '**One item, every bug.** This seed has no fan-out, so ONE session owns every flow on the quest',
      ),
      partitionIsTheDifference: hasOrchestrator(
        'how your planner partitions those flows is the whole difference between\na focused run and a skim',
      ),
      denominator: hasOrchestrator(
        '**Your denominator is the `EXPECTED:` observables across every bug flow.**',
      ),
      denominatorTool: hasOrchestrator("get-quest({ questId: 'QUEST_ID' })"),
      recomputedNotRecalled: hasOrchestrator(
        'that recomputed count, never your recollection, is what gate 10 signals on',
      ),
      nothingReverifies: hasOrchestrator('**Nothing re-verifies you.**'),
      namesTheRelayTail: hasOrchestrator('`ward(changed) → ward(full)`'),
      noSignoffTrack: hasOrchestrator(
        'this discipline has no\nsign-off track, so nothing server-side recomputes a denominator when you signal',
      ),
      reviewerIsTheOnlyGuard: hasOrchestrator(
        'The reviewer you\ndispatch is the only thing between a false green and a shipped bug.',
      ),
      additiveSpecAuthority: hasOrchestrator('**Additive spec authority.**'),
      additiveOnly: hasOrchestrator('never delete a\nnode, never mint a new flow'),
      unreproducibleIsPartial: hasOrchestrator(
        'A repro nobody\ncould drive at all is a `partial` with the evidence committed, never a `done`.',
      ),
    }).toStrictEqual({
      oneItemEveryBug: true,
      partitionIsTheDifference: true,
      denominator: true,
      denominatorTool: true,
      recomputedNotRecalled: true,
      nothingReverifies: true,
      namesTheRelayTail: true,
      noSignoffTrack: true,
      reviewerIsTheOnlyGuard: true,
      additiveSpecAuthority: true,
      additiveOnly: true,
      unreproducibleIsPartial: true,
    });
  });

  it('VALID: plannerMarkdown => partitions by bug first and orders the test piece ahead of the fix', () => {
    expect({
      ownsEveryFlow: hasPlanner('**One session owns EVERY flow on this quest.**'),
      noUpstreamSplit: hasPlanner(
        'The item does not fan out, so nothing upstream split\nthe bugs and your partition is the only one there will ever be.',
      ),
      cutOnTheFlowBoundaryFirst: hasPlanner('Cut on the FLOW boundary first'),
      namesTheSkimCost: hasPlanner(
        'a piece spanning both is a\npiece whose worker fixes one and skims the other',
      ),
      skimIsInvisible: hasPlanner('the half it skimmed has no\nfailing test to notice'),
      thenCutInsideABug: hasPlanner('Only then cut inside a bug'),
      testPieceBeforeFixPiece: hasPlanner(
        'the piece that writes\nthe reproducing test must land BEFORE the piece that fixes it',
      ),
      namesWhyOrderMatters: hasPlanner(
        'a fix that arrives first leaves\nnothing red to prove the bug was ever real',
      ),
    }).toStrictEqual({
      ownsEveryFlow: true,
      noUpstreamSplit: true,
      cutOnTheFlowBoundaryFirst: true,
      namesTheSkimCost: true,
      skimIsInvisible: true,
      thenCutInsideABug: true,
      testPieceBeforeFixPiece: true,
      namesWhyOrderMatters: true,
    });
  });

  it('VALID: plannerMarkdown => establishes where the bug lives before planning the fix, and may spike', () => {
    expect({
      establishWhereItLives: hasPlanner(
        '**Your job is to establish WHERE the bug actually lives.**',
      ),
      symptomIsNotTheCause: hasPlanner(
        'A plan written off the report names the\nfile the symptom is VISIBLE in, and that is routinely not the file the defect is in',
      ),
      namesTheWorkedExample: hasPlanner(
        'a wrong row\ncount rendered by a widget whose real cause is the transformer feeding it',
      ),
      tracesTheDataPath: hasPlanner('Trace symptom → wire →\ncontract'),
      exitIsAFileLine: hasPlanner(
        'stop only when you can name a `file:line` and say why it produces the symptom',
      ),
      maySpike: hasPlanner(
        '**You may spike to find out, and on this discipline the spike is diagnostic rather than net-new.**',
      ),
      spikeItYourself: hasPlanner('do it\nYOURSELF rather than spawning for it'),
      namesWhyNotDelegated: hasPlanner(
        "a sub-agent's conclusion about where a bug lives is exactly\nthe conclusion no gate downstream ever re-reads",
      ),
      findingsLandInNotes: hasPlanner("Leave what you learned in the piece's `notes`"),
      probesAreRemoved: hasPlanner('remove any probe you added to\nproduct code before you finish'),
      reportContradictionIsADecision: hasPlanner(
        'plan against what you OBSERVED and name\nboth readings in `DECISIONS FOR YOU`',
      ),
    }).toStrictEqual({
      establishWhereItLives: true,
      symptomIsNotTheCause: true,
      namesTheWorkedExample: true,
      tracesTheDataPath: true,
      exitIsAFileLine: true,
      maySpike: true,
      spikeItYourself: true,
      namesWhyNotDelegated: true,
      findingsLandInNotes: true,
      probesAreRemoved: true,
      reportContradictionIsADecision: true,
    });
  });

  // A piece graded against a paraphrase is a piece that can be green while the reported bug stands.
  it('VALID: plannerMarkdown => every piece names its observable verbatim and its test layer', () => {
    expect({
      unitIdsAreObservableIds: hasPlanner(
        '**`unitIds`** carries the `id` of every `EXPECTED:` observable the piece makes true.',
      ),
      unitlessPieceOwesAReason: hasPlanner('is a piece nobody can grade'),
      intentQuotesVerbatim: hasPlanner(
        "**`intent`** quotes that observable's `description` VERBATIM, not a paraphrase.",
      ),
      namesTheParaphraseCost: hasPlanner(
        'a paraphrase is how a test ends up asserting something\n  adjacent that was merely easier to assert',
      ),
      notesNameTheLayer: hasPlanner(
        '**`notes`** names the LAYER the reproducing test belongs at, and why.',
      ),
      typePicksTheLayer: hasPlanner("The observable's `type`\n  decides it"),
      browserMeansPlaywright: hasPlanner(
        "Playwright `*.e2e.ts` colocated in the entry flow's folder of a `frontend-react` /",
      ),
      everythingElseIsUnitOrIntegration: hasPlanner(
        'every other\n  type means a unit or integration test alongside the implementation',
      ),
      defaultToE2e: hasPlanner('Default to e2e for any "I\n  don\'t see X in the UI" report.'),
      workerWritesTheE2e: hasPlanner(
        '**On THIS discipline the worker writes the `.e2e.ts` itself**',
      ),
      filesCarryTheCauseNotTheSymptom: hasPlanner(
        'so the worker fixes\n  where the defect IS rather than where it shows',
      ),
    }).toStrictEqual({
      unitIdsAreObservableIds: true,
      unitlessPieceOwesAReason: true,
      intentQuotesVerbatim: true,
      namesTheParaphraseCost: true,
      notesNameTheLayer: true,
      typePicksTheLayer: true,
      browserMeansPlaywright: true,
      everythingElseIsUnitOrIntegration: true,
      defaultToE2e: true,
      workerWritesTheE2e: true,
      filesCarryTheCauseNotTheSymptom: true,
    });
  });

  // The template's own red step shells an implementation that does not exist yet. Here it does
  // exist and is wrong, so the red has to be witnessed against unchanged source instead.
  it('VALID: workerMarkdown => writes the failing test first, against unchanged source', () => {
    expect({
      inversion: hasWorker(
        'You are fixing a REPORTED BUG. The product code your piece targets already exists and already runs;\nwhat is wrong is what it DOES.',
      ),
      nothingToShellOut: hasWorker(
        'there is nothing to shell out, and\nthe red you must witness is the real system misbehaving on unchanged source',
      ),
      testFirstHeading: hasWorker(
        '## 1. Write the failing test FIRST — before you open the implementation',
      ),
      beforeYouPlanTheEdit: hasWorker('Not "before you edit it": before you plan the edit.'),
      namesTheCost: hasWorker(
        'A fix already formed in your head selects an\nassertion that fits the FIX rather than the BUG.',
      ),
      layerFromTheBrief: hasWorker('The layer comes from your brief, not from convenience'),
      writesItsOwnE2e: hasWorker(
        '**Writing that `.e2e.ts`\nyourself is part of this discipline**, unlike disciplines that must leave Playwright specs alone',
      ),
      e2eWalkIsTheReproPath: hasWorker(
        "the walk that reproduces the bug\nis the flow's path from its `entryPoint` to its `ACTUAL:` terminal",
      ),
      noShortcuttingTheWalk: hasWorker(
        'never shortcut them by writing state the UI is supposed to write',
      ),
    }).toStrictEqual({
      inversion: true,
      nothingToShellOut: true,
      testFirstHeading: true,
      beforeYouPlanTheEdit: true,
      namesTheCost: true,
      layerFromTheBrief: true,
      writesItsOwnE2e: true,
      e2eWalkIsTheReproPath: true,
      noShortcuttingTheWalk: true,
    });
  });

  // A structural red is the failure mode this whole discipline turns on: the fix under it fixed the
  // test, and every gate behind it reads green.
  it('VALID: workerMarkdown => requires the red to be an assertion red naming the reported symptom', () => {
    expect({
      heading: hasWorker('## 2. Watch it fail for the RIGHT REASON — this is the whole gate'),
      readTheOutput: hasWorker('Run it against UNCHANGED source and **read the failure output**'),
      redComesFromTheAssertion: hasWorker(
        'Does the failure come from YOUR ASSERTION, on the line that asserts the observable?',
      ),
      actualValueMatchesTheSymptom: hasWorker(
        'Does the actual value it prints match the `ACTUAL:` symptom the report describes?',
      ),
      concreteExamples: hasWorker(
        'An empty panel\n  where the report says "empty panel"; two rows where the report says "one row per file".',
      ),
      structuralRedIsNotAReproduction: hasWorker(
        '**A test that fails on an import error, a typo, a missing fixture, a selector that matches nothing,\na timeout reached before the assertion, or a setup that throws is NOT a reproduction.**',
      ),
      theFixWouldFixTheTest: hasWorker(
        'the fix that "makes it pass" fixes the TEST rather than the bug',
      ),
      namesWhyNothingCatchesIt: hasWorker(
        "everything downstream — your parent's\ncommit, the ward gate, the quest's own completion — then reads green, and no later session re-checks\nit",
      ),
      structuralRedMeansTheTestIsBroken: hasWorker(
        'When the red is structural, the TEST is broken, not the implementation.',
      ),
      keepGoingUntilItIsAnAssertionRed: hasWorker(
        'Keep going until the red is an ASSERTION red whose actual value IS the reported\nsymptom.',
      ),
      captureTheOutput: hasWorker('**Capture that output.**'),
      reviewerCannotReDeriveFromItFailed: hasWorker(
        'Your reviewer re-derives whether the red was the right red, and it cannot do that from\n"it failed"',
      ),
    }).toStrictEqual({
      heading: true,
      readTheOutput: true,
      redComesFromTheAssertion: true,
      actualValueMatchesTheSymptom: true,
      concreteExamples: true,
      structuralRedIsNotAReproduction: true,
      theFixWouldFixTheTest: true,
      namesWhyNothingCatchesIt: true,
      structuralRedMeansTheTestIsBroken: true,
      keepGoingUntilItIsAnAssertionRed: true,
      captureTheOutput: true,
      reviewerCannotReDeriveFromItFailed: true,
    });
  });

  it('VALID: workerMarkdown => fixes narrowly only after the red, then watches it pass and ripple-checks', () => {
    expect({
      fixComesThird: hasWorker('## 3. Only now, fix it'),
      narrowest: hasWorker(
        'Apply the NARROWEST change that makes the observable true at its real cause',
      ),
      atTheCauseNotTheSymptom: hasWorker(
        'the file your brief\nnames, which is where the defect is rather than where it shows',
      ),
      resistTheRewrite: hasWorker('Resist the rewrite'),
      biggerFixGoesToUnfixable: hasWorker(
        'say so\nin `UNFIXABLE` with what you found rather than half-landing it',
      ),
      probesDeleted: hasWorker(
        'Delete every temporary `process.stderr.write` probe you added while diagnosing.',
      ),
      passHeading: hasWorker('## 4. Watch it pass, then ripple-check'),
      loosenedTestCertifiesTheBug: hasWorker(
        'a test that now passes\nbecause you loosened it certifies the bug',
      ),
      rippleSurfaces: hasWorker(
        "the function's other callers, the sibling surface rendering the same value, another bug flow on this\nquest whose repro crosses the same file",
      ),
      rippleCost: hasWorker('A one-line fix with an unchecked ripple is how one bug becomes two.'),
      unreproducibleIsAFinding: hasWorker(
        'If you cannot reproduce the bug as described at all, that is a FINDING, not a failure',
      ),
      neverFabricateARed: hasWorker('Never report a red you did not see.'),
    }).toStrictEqual({
      fixComesThird: true,
      narrowest: true,
      atTheCauseNotTheSymptom: true,
      resistTheRewrite: true,
      biggerFixGoesToUnfixable: true,
      probesDeleted: true,
      passHeading: true,
      loosenedTestCertifiesTheBug: true,
      rippleSurfaces: true,
      rippleCost: true,
      unreproducibleIsAFinding: true,
      neverFabricateARed: true,
    });
  });

  // `bug-hunt`'s relay tail is ward → ward. Nothing downstream re-verifies, and no completion gate
  // recomputes anything, so a reviewer that grades softly here ships the bug.
  it('VALID: reviewerMarkdown => states plainly that nothing runs behind this discipline', () => {
    expect({
      nothingRunsBehind: hasReviewer('**Nothing runs behind this discipline.**'),
      namesTheTail: hasReviewer('`ward(changed) → ward(full)` and nothing else'),
      namesWhatIsAbsent: hasReviewer('no flow-test role, no browser walk, no manual QA'),
      noGateRecomputes: hasReviewer(
        'so `signal-back` recomputes no denominator and refuses no\n`done`',
      ),
      onlyReadingHere: hasReviewer(
        'On every other discipline you are one reading among several. Here you are the only thing\nstanding between a false green and a shipped bug.',
      ),
    }).toStrictEqual({
      nothingRunsBehind: true,
      namesTheTail: true,
      namesWhatIsAbsent: true,
      noGateRecomputes: true,
      onlyReadingHere: true,
    });
  });

  it('VALID: reviewerMarkdown => checks coverage as a set difference over the EXPECTED observables', () => {
    expect({
      heading: hasReviewer(
        '## 1. Coverage — one test per `EXPECTED:` observable, as a set difference',
      ),
      enumerateThenMatch: hasReviewer(
        'Enumerate every `EXPECTED:` observable id across every flow on the quest, then find the test that\nasserts each.',
      ),
      unmatchedIsARemainder: hasReviewer(
        'Anything unmatched is a `REMAINDER` line naming that observable id.',
      ),
      intermediateCauseIsAlsoUnmatched: hasReviewer(
        'An observable\n"covered" by a test that asserts an intermediate cause instead of the observable\'s own\n`description` is ALSO unmatched.',
      ),
    }).toStrictEqual({
      heading: true,
      enumerateThenMatch: true,
      unmatchedIsARemainder: true,
      intermediateCauseIsAlsoUnmatched: true,
    });
  });

  // The worker's return shape reports `WARD: green|red` and carries no field for which red it saw,
  // so "I watched it fail first" is unverifiable from the return by construction.
  it('VALID: reviewerMarkdown => re-derives the witnessed red rather than trusting the worker', () => {
    expect({
      returnSaysNothingAboutTheRed: hasReviewer(
        "**A worker's return reports `WARD: green|red` and says nothing about WHICH red it saw.**",
      ),
      unverifiedByConstruction: hasReviewer('is unverified by construction'),
      reDeriveFromTheTest: hasReviewer('Re-derive it from the test itself'),
      assertionTargetsTheWords: hasReviewer(
        "Does its assertion target the observable's own words?",
      ),
      productRedNotStructuralRed: hasReviewer(
        'rather than an import error, a typo, a missing fixture, a selector matching\n  nothing, or a timeout before the assertion was reached?',
      ),
      structuralRedReproducedNothing: hasReviewer(
        'A structural red reproduced nothing, and\n  the fix under it fixed the test.',
      ),
      valueMatchesTheSymptom: hasReviewer(
        'Does the value it would have reported match the `ACTUAL:` symptom the bug report describes?',
      ),
    }).toStrictEqual({
      returnSaysNothingAboutTheRed: true,
      unverifiedByConstruction: true,
      reDeriveFromTheTest: true,
      assertionTargetsTheWords: true,
      productRedNotStructuralRed: true,
      structuralRedReproducedNothing: true,
      valueMatchesTheSymptom: true,
    });
  });

  it('VALID: reviewerMarkdown => makes the mutation check the whole verdict', () => {
    expect({
      heading: hasReviewer('## 3. The mutation check — here it IS the verdict'),
      revertAndConfirm: hasReviewer('**revert the fix and confirm the test fails.**'),
      howToRevert: hasReviewer(
        'Restore the old\nexpression, flip the condition back, comment the changed line out',
      ),
      thenRestoreIt: hasReviewer('then restore the fix and watch it pass again. Do this per bug.'),
      elsewhereOneSignalHereTheProof: hasReviewer(
        'Elsewhere a mutation check is one signal among several. Here it is the ENTIRE proof that a\nreproduction ever happened',
      ),
      indistinguishableInAGreenRun: hasReviewer(
        'indistinguishable — from the outside, in a green run — from one that proves the fix',
      ),
      survivorIsARemainder: hasReviewer(
        'A test that\nsurvives the revert is a `REMAINDER`, not a `PIECES: accept`.',
      ),
    }).toStrictEqual({
      heading: true,
      revertAndConfirm: true,
      howToRevert: true,
      thenRestoreIt: true,
      elsewhereOneSignalHereTheProof: true,
      indistinguishableInAGreenRun: true,
      survivorIsARemainder: true,
    });
  });

  it('VALID: reviewerMarkdown => holds the fix to the narrowest change and checks its ripple', () => {
    expect({
      narrowestHeading: hasReviewer('## 4. Is the fix the NARROWEST one that closes the bug?'),
      rewriteIsAFinding: hasReviewer(
        'A rewrite, a refactor, a new abstraction or a broadened\nsignature that happens to make the test pass is a finding',
      ),
      namesTheBlastRadiusCost: hasReviewer(
        'it enlarges the blast radius on the one\nquest type where nothing re-verifies it',
      ),
      nameTheMinimalChange: hasReviewer('Name the minimal change that would have done.'),
      wrongDepthIsTheOppositeFailure: hasReviewer(
        'The opposite failure is a fix at the wrong DEPTH — patched where the symptom renders rather than\nwhere the value goes wrong.',
      ),
      anotherCaller: hasReviewer('Ask whether another caller can still reach the same defect.'),
      rippleHeading: hasReviewer('## 5. Did the ripple get checked?'),
      rippleIsYours: hasReviewer('A worker sees one piece; you see the round.'),
    }).toStrictEqual({
      narrowestHeading: true,
      rewriteIsAFinding: true,
      namesTheBlastRadiusCost: true,
      nameTheMinimalChange: true,
      wrongDepthIsTheOppositeFailure: true,
      anotherCaller: true,
      rippleHeading: true,
      rippleIsYours: true,
    });
  });

  // A test asserting something adjacent passes while the reported bug stands, which is the exact
  // shape a green run cannot distinguish from a fix.
  it('VALID: reviewerMarkdown => makes the reported symptom the acceptance target', () => {
    expect({
      heading: hasReviewer('## 6. The reported symptom is the acceptance target'),
      reReadTheReport: hasReviewer(
        "**re-read `userRequest`, the bug report in the user's own words, and\nconfirm the test asserts THAT**",
      ),
      notSomethingAdjacent: hasReviewer('not something adjacent that was easier to assert'),
      testsDriftOnTheirOwn: hasReviewer('Tests drift that\nway on their own.'),
      rowCountExample: hasReviewer(
        'A report saying "one row per quest file on disk" is satisfied only by an assertion\non the ROW COUNT against the file count',
      ),
      adjacentAssertionPassesAnyway: hasReviewer(
        'an assertion that some row renders the right text passes\nhappily while the reported bug is fully intact',
      ),
      quoteBothSentences: hasReviewer(
        'quote BOTH sentences, what the user said and what the test checks, so the next\nround cannot argue it away',
      ),
    }).toStrictEqual({
      heading: true,
      reReadTheReport: true,
      notSomethingAdjacent: true,
      testsDriftOnTheirOwn: true,
      rowCountExample: true,
      adjacentAssertionPassesAnyway: true,
      quoteBothSentences: true,
    });
  });

  // The reviewer's return shape is the loop's wire contract; a pack that drops a field breaks the
  // parent's routing, so the empty track is REPORTED rather than omitted.
  it('VALID: reviewerMarkdown => reports the empty sign-off track instead of dropping the field', () => {
    expect({
      heading: hasReviewer('## Sign-offs: there is no track on this discipline'),
      namesTheAbsentFields: hasReviewer(
        'No `flowriderSignoff`, no `siegemasterSignoff`, no completion gate.',
      ),
      exactReturnValue: hasReviewer('SIGNOFFS WRITTEN: 0 (no track on this discipline)'),
      ratherThanDropping: hasReviewer('rather than dropping the field'),
      remainderCarriesTheOutcome: hasReviewer(
        'let\n`REMAINDER` carry the entire outcome — it is the only channel that survives you',
      ),
      blightDispositionsStillWritten: hasReviewer(
        '(The per-unit\ndispositions the standing concerns ask for are a different record; you still write those.)',
      ),
    }).toStrictEqual({
      heading: true,
      namesTheAbsentFields: true,
      exactReturnValue: true,
      ratherThanDropping: true,
      remainderCarriesTheOutcome: true,
      blightDispositionsStillWritten: true,
    });
  });
});
