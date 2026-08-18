import { disciplineBugReproStatics } from './discipline-bug-repro-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineBugReproStatics;

const FORBIDDEN_IN_AN_OPERATOR_BLOCK = [
  'get-architecture',
  'get-syntax-rules',
  'get-testing-patterns',
  'discover',
  'get-project-map',
  'get-project-inventory',
  'get-folder-detail',
  'get-blight-checklist',
  'npm run ward',
  'git log',
  'git diff',
  'git commit',
];

// `flowNodeContract` carries id/label/type/packages/observables and has nowhere to put an
// actual-versus-expected flag, so the indicator rides in the node LABEL. `dumpsterHuntPromptStatics`
// writes them and every block here reads them, and nothing typechecks that they agree — this test is
// the only thing holding it.
const ACTUAL_PREFIX = 'ACTUAL: <symptom today>';
const EXPECTED_PREFIX = 'EXPECTED: <what the fix must make real>';

describe('disciplineBugReproStatics', () => {
  it('VALID: exported value => carries exactly the four blocks, all non-empty strings', () => {
    expect(disciplineBugReproStatics).toStrictEqual({
      operatorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  // The planner reads the flow to cut chunks from it and the reviewer reads it to rebuild the
  // denominator, so both must spell the convention identically. The OPERATOR does not state it at
  // all, and that is the four-field rule doing its job: it opens no flow, so the spec shape is
  // subject matter it could only forward.
  it('VALID: the label convention => is spelled identically in the two blocks that read the flow', () => {
    expect({
      plannerActual: plannerMarkdown.includes(ACTUAL_PREFIX),
      plannerExpected: plannerMarkdown.includes(EXPECTED_PREFIX),
      reviewerActual: reviewerMarkdown.includes(ACTUAL_PREFIX),
      reviewerExpected: reviewerMarkdown.includes(EXPECTED_PREFIX),
      operatorActual: operatorMarkdown.includes(ACTUAL_PREFIX),
      operatorExpected: operatorMarkdown.includes(EXPECTED_PREFIX),
    }).toStrictEqual({
      plannerActual: true,
      plannerExpected: true,
      reviewerActual: true,
      reviewerExpected: true,
      operatorActual: false,
      operatorExpected: false,
    });
  });

  describe('operatorMarkdown is two fields and nothing else', () => {
    it('VALID: operatorMarkdown => carries exactly RESOURCE and RESET, in that order', () => {
      expect(
        Array.from(operatorMarkdown.matchAll(/\*\*([A-Z]+):\*\*/gu)).map((match) => match[1]),
      ).toStrictEqual(['RESOURCE', 'RESET']);
    });

    it('VALID: operatorMarkdown => names no tool the operator template forbids', () => {
      expect(
        FORBIDDEN_IN_AN_OPERATOR_BLOCK.filter((tool) => operatorMarkdown.includes(tool)),
      ).toStrictEqual([]);
    });

    it('VALID: operatorMarkdown => stays inside the budget that keeps this session small', () => {
      expect(operatorMarkdown.length).toBeLessThan(1_200);
    });

    it('VALID: operatorMarkdown => is both fields as none, and restates no scope of its own', () => {
      expect({
        resourceNone: operatorMarkdown.includes('**RESOURCE:** none.'),
        resetNone: operatorMarkdown.includes('**RESET:** none.'),
        noScopeProse: operatorMarkdown.includes('bug-hunt front'),
        noFanOutProse: operatorMarkdown.includes('fan-out'),
        noDenominatorProse: operatorMarkdown.includes('denominator'),
        noEmptyRule: operatorMarkdown.includes('zero chunks'),
      }).toStrictEqual({
        resourceNone: true,
        resetNone: true,
        noScopeProse: false,
        noFanOutProse: false,
        noDenominatorProse: false,
        noEmptyRule: false,
      });
    });

    // This seed has NO fan-out, so one session owns every flow on the quest however many bugs the
    // report named. Nothing upstream split them and nothing downstream picks up the one that got
    // skimmed — so how the planner partitions them is the whole difference between a focused run and
    // a skim, and the PLANNER is the session that does the partitioning. Telling the operator would
    // only have made it a courier for a rule it cannot apply.
    it('VALID: plannerMarkdown => owns the one-item-every-bug framing the operator block used to hold', () => {
      expect({
        oneSessionEveryFlow: plannerMarkdown.includes(
          '**One session owns EVERY flow on this quest.**',
        ),
        noFanOut: plannerMarkdown.includes('The item does not fan out'),
        onlyPartitionThereWillBe: plannerMarkdown.includes(
          'your partition is the only one there will ever be',
        ),
        readsTheQuestItself: plannerMarkdown.includes(
          "Read the quest yourself with `get-quest({ questId: 'QUEST_ID' })`",
        ),
      }).toStrictEqual({
        oneSessionEveryFlow: true,
        noFanOut: true,
        onlyPartitionThereWillBe: true,
        readsTheQuestItself: true,
      });
    });
  });

  // This discipline INVERTS the usual red step: the product already exists and already runs, so
  // there is nothing to shell out and the red must come from the real system misbehaving on
  // unchanged source. A worker template that hard-coded shell-then-implement was wrong here.
  describe('workerMarkdown carries the two headings the worker template points at', () => {
    it('VALID: workerMarkdown => carries ### The work and ### The proof, work first', () => {
      expect({
        work: /^### The work$/mu.test(workerMarkdown),
        proof: /^### The proof$/mu.test(workerMarkdown),
        workFirst: workerMarkdown.indexOf('### The work') < workerMarkdown.indexOf('### The proof'),
      }).toStrictEqual({ work: true, proof: true, workFirst: true });
    });

    it('VALID: workerMarkdown => opens by saying the product already runs, so the red step inverts', () => {
      expect({
        alreadyRuns: workerMarkdown.includes(
          '**The product code your chunk targets already exists and already\nruns; what is wrong is what it DOES.**',
        ),
        nothingToShell: workerMarkdown.includes('there is nothing to shell\nout'),
        redOnUnchangedSource: workerMarkdown.includes(
          'the red you must witness is the real system misbehaving on unchanged source',
        ),
        assertTheObservable: workerMarkdown.includes('**Assert THAT sentence**'),
        neverAnIntermediateCause: workerMarkdown.includes(
          'never an intermediate cause you\nfound on the way to it',
        ),
        oneObservableOneTest: workerMarkdown.includes('One observable, one test.'),
      }).toStrictEqual({
        alreadyRuns: true,
        nothingToShell: true,
        redOnUnchangedSource: true,
        assertTheObservable: true,
        neverAnIntermediateCause: true,
        oneObservableOneTest: true,
      });
    });

    it('VALID: ### The work => writes the test before planning the edit, fixes narrowly, then ripples', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        steps: Array.from(work.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        beforeYouOpenIt: work.includes(
          '**Write the failing test FIRST — before you open the implementation.**',
        ),
        beforeYouPlanTheEdit: work.includes('before you plan the edit'),
        aFixInYourHeadPicksTheAssertion: work.includes(
          'A fix already formed in your head selects an assertion that fits the FIX\n   rather than the BUG',
        ),
        writesItsOwnE2e: work.includes(
          '**Writing\n   that `.e2e.ts` yourself is part of this discipline**',
        ),
        narrowestChange: work.includes('Apply the NARROWEST change'),
        atItsRealCause: work.includes('**at its real\n   cause**'),
        resistTheRewrite: work.includes('Resist the rewrite'),
        biggerFixIsRework: work.includes('that is `NEXT: rework` with what you found'),
        deleteTheProbes: work.includes('Delete every temporary `process.stderr.write` probe'),
        rippleCheck: work.includes('**Watch it pass, then ripple-check.**'),
        loosenedCertifiesTheBug: work.includes(
          'a test that now passes because you loosened it certifies the bug',
        ),
        oneBugBecomesTwo: work.includes(
          '**A one-line fix with an\n   unchecked ripple is how one bug becomes two.**',
        ),
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **'],
        beforeYouOpenIt: true,
        beforeYouPlanTheEdit: true,
        aFixInYourHeadPicksTheAssertion: true,
        writesItsOwnE2e: true,
        narrowestChange: true,
        atItsRealCause: true,
        resistTheRewrite: true,
        biggerFixIsRework: true,
        deleteTheProbes: true,
        rippleCheck: true,
        loosenedCertifiesTheBug: true,
        oneBugBecomesTwo: true,
      });
    });

    // The most expensive mistake on this discipline: a structural red reproduces nothing, and the
    // fix that "makes it pass" fixes the TEST. Everything downstream then reads green and no later
    // session re-checks it, because this quest type's relay tail is two ward runs and nothing else.
    it('VALID: ### The proof => demands an ASSERTION red whose value matches the reported symptom', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        theWholeGate: proof.includes('This is the whole gate.**'),
        againstUnchangedSource: proof.includes('Run it against\nUNCHANGED source'),
        fromYourAssertion: proof.includes('Does the failure come from YOUR ASSERTION'),
        matchesTheActualSymptom: proof.includes(
          'Does the actual value it prints match the `ACTUAL:` symptom',
        ),
        structuralIsNotAReproduction: proof.includes('is NOT a reproduction.**'),
        fixesTheTest: proof.includes(
          'the fix that "makes it pass" fixes the TEST rather than the bug',
        ),
        mostExpensiveMistake: proof.includes(
          'This\nis the most expensive mistake available on this discipline',
        ),
        noLaterSessionRechecks: proof.includes('no later session re-checks it'),
        theTestIsBroken: proof.includes('When the red is structural, the TEST is broken'),
        keepGoing: proof.includes('Keep going until the red is an ASSERTION red'),
        captureTheOutput: proof.includes('**Capture that output.**'),
        cannotDoItFromItFailed: proof.includes('it cannot do that from "it failed"'),
        cannotReproduceIsAFinding: proof.includes(
          '**If you cannot reproduce the bug as described at all, that is a FINDING, not a failure**',
        ),
        neverReportAnUnseenRed: proof.includes('**Never\nreport a red you did not see.**'),
      }).toStrictEqual({
        theWholeGate: true,
        againstUnchangedSource: true,
        fromYourAssertion: true,
        matchesTheActualSymptom: true,
        structuralIsNotAReproduction: true,
        fixesTheTest: true,
        mostExpensiveMistake: true,
        noLaterSessionRechecks: true,
        theTestIsBroken: true,
        keepGoing: true,
        captureTheOutput: true,
        cannotDoItFromItFailed: true,
        cannotReproduceIsAFinding: true,
        neverReportAnUnseenRed: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    it('VALID: plannerMarkdown => partitions by bug first and orders the repro chunk before the fix', () => {
      expect({
        oneFlowPerBug: plannerMarkdown.includes('its spec is **ONE FLOW PER BUG**'),
        flowCountIsBugCount: plannerMarkdown.includes('the flow count IS the bug\ncount'),
        observablesOnExpectedOnly: plannerMarkdown.includes('EXPECTED side ONLY'),
        forkNamesTheDivergence: plannerMarkdown.includes('The fork\nnode names the divergence'),
        cutOnTheFlowBoundary: plannerMarkdown.includes('Cut on the FLOW boundary first'),
        skimIsInvisible: plannerMarkdown.includes(
          'invisibly, because the half it skimmed has no\nfailing test to notice',
        ),
        reproBeforeFix: plannerMarkdown.includes(
          'the chunk that writes the reproducing test must be numbered BEFORE the chunk that\nfixes it',
        ),
        fixFirstProvesNothing: plannerMarkdown.includes(
          'A fix that arrives first leaves nothing red to prove the bug was ever real.',
        ),
      }).toStrictEqual({
        oneFlowPerBug: true,
        flowCountIsBugCount: true,
        observablesOnExpectedOnly: true,
        forkNamesTheDivergence: true,
        cutOnTheFlowBoundary: true,
        skimIsInvisible: true,
        reproBeforeFix: true,
        fixFirstProvesNothing: true,
      });
    });

    // A plan written off the report names the file the symptom is VISIBLE in, and that is routinely
    // not the file the defect is in.
    it('VALID: plannerMarkdown => traces to a file:line before planning the fix, and spikes diagnostically', () => {
      expect({
        establishWhereItLives: plannerMarkdown.includes(
          '**Your job is to establish WHERE the bug actually lives.**',
        ),
        visibleIsNotWhereItIs: plannerMarkdown.includes(
          'that is routinely not the file the defect is in',
        ),
        stopAtAFileLine: plannerMarkdown.includes('stop only when you can name a `file:line`'),
        diagnosticNotKept: plannerMarkdown.includes('**Your spike is DIAGNOSTIC here, not kept.**'),
        doItYourself: plannerMarkdown.includes('do\nit YOURSELF rather than spawning for it'),
        noGateRereadsIt: plannerMarkdown.includes(
          "a sub-agent's conclusion about where a bug lives is exactly\nthe conclusion no gate downstream ever re-reads",
        ),
        removeTheProbe: plannerMarkdown.includes(
          'remove any probe you added to\nproduct code before you return',
        ),
        reportWrongIsAFinding: plannerMarkdown.includes(
          '**A bug that turns out to\nbe different from the report is a FINDING, not a wall**',
        ),
      }).toStrictEqual({
        establishWhereItLives: true,
        visibleIsNotWhereItIs: true,
        stopAtAFileLine: true,
        diagnosticNotKept: true,
        doItYourself: true,
        noGateRereadsIt: true,
        removeTheProbe: true,
        reportWrongIsAFinding: true,
      });
    });

    it('VALID: plannerMarkdown => quotes the observable verbatim, names the layer, and writes the ward line', () => {
      expect({
        unitsCarryExpectedIds: plannerMarkdown.includes(
          '**`UNITS`** carries the `id` of every `EXPECTED:` observable',
        ),
        intentQuotesVerbatim: plannerMarkdown.includes('VERBATIM, not a paraphrase'),
        paraphraseDrifts: plannerMarkdown.includes(
          'a paraphrase is how a test ends up asserting something\n  adjacent',
        ),
        notesNamesTheLayer: plannerMarkdown.includes('**`NOTES`** names the LAYER'),
        defaultToE2e: plannerMarkdown.includes(
          'Default to e2e for any "I\n  don\'t see X in the UI" report.',
        ),
        filesCarryTheCause: plannerMarkdown.includes(
          '**`FILES`** must also carry the implementation file you traced the cause to',
        ),
        wardFollowsTheLayer: plannerMarkdown.includes('**`WARD`** follows that layer'),
        e2eWard: plannerMarkdown.includes('`--only lint,typecheck,e2e` for an e2e chunk'),
      }).toStrictEqual({
        unitsCarryExpectedIds: true,
        intentQuotesVerbatim: true,
        paraphraseDrifts: true,
        notesNamesTheLayer: true,
        defaultToE2e: true,
        filesCarryTheCause: true,
        wardFollowsTheLayer: true,
        e2eWard: true,
      });
    });

    // The item is bounded and owns every bug, so repeating `rework` on the same undrivable
    // observable spends the whole chain and blocks the quest on the bugs that DID get fixed.
    it('VALID: plannerMarkdown => refuses to re-plan a repro a previous round already failed the same way', () => {
      expect({
        heading: plannerMarkdown.includes('## When this item has become a wall'),
        worthOneRound: plannerMarkdown.includes(
          '**A repro nobody could drive is worth ONE `rework` round, not a chain of them.**',
        ),
        readThePreviousCommits: plannerMarkdown.includes(
          'read the previous `review <n>:` commit bodies',
        ),
        doNotPlanItAgain: plannerMarkdown.includes('do NOT plan it\nagain'),
        letTheReviewerRecordIt: plannerMarkdown.includes(
          'let the reviewer record the\nundrivable one as an open question',
        ),
        repeatingBlocksTheQuest: plannerMarkdown.includes(
          'Repeating it spends the whole chain and blocks the quest on the\nbugs you already fixed.',
        ),
      }).toStrictEqual({
        heading: true,
        worthOneRound: true,
        readThePreviousCommits: true,
        doNotPlanItAgain: true,
        letTheReviewerRecordIt: true,
        repeatingBlocksTheQuest: true,
      });
    });
  });

  // The relay tail on a bug-hunt quest is `ward(changed) → ward(full)` and nothing else, and there is
  // no sign-off track — so `signal-back` recomputes no denominator and refuses no `done`. This
  // reviewer is literally the last thing between a false green and a shipped bug, which is why its
  // block is the longest one in the pack and why the mutation check is the verdict rather than a
  // signal among several.
  describe('reviewerMarkdown is the last gate on this quest type', () => {
    it('VALID: reviewerMarkdown => says nothing runs behind it, and never takes the red on trust', () => {
      expect({
        nothingRunsBehind: reviewerMarkdown.includes('**Nothing runs behind this discipline.**'),
        theRelayTail: reviewerMarkdown.includes('`ward(changed) → ward(full)` and nothing else'),
        noTrackNoGate: reviewerMarkdown.includes(
          '`signal-back` recomputes no denominator and refuses no\n`done`',
        ),
        onlyThingStanding: reviewerMarkdown.includes(
          '**Here you are the only thing\nstanding between a false green and a shipped bug**',
        ),
        neverOnTrust: reviewerMarkdown.includes(
          "never close a round on a worker's word that it\nwent red first",
        ),
        reDeriveTheRed: reviewerMarkdown.includes(
          '## 2. Was the red real — re-derive it, never take it',
        ),
        unverifiedByConstruction: reviewerMarkdown.includes(
          'So "I watched it fail first" is unverified by',
        ),
      }).toStrictEqual({
        nothingRunsBehind: true,
        theRelayTail: true,
        noTrackNoGate: true,
        onlyThingStanding: true,
        neverOnTrust: true,
        reDeriveTheRed: true,
        unverifiedByConstruction: true,
      });
    });

    it('VALID: reviewerMarkdown => runs its six numbered checks, with the mutation check as the verdict', () => {
      expect({
        checks: Array.from(reviewerMarkdown.matchAll(/^## (\d)\. /gmu)).map((match) => match[1]),
        coverageAsSetDifference: reviewerMarkdown.includes(
          '## 1. Coverage — one test per `EXPECTED:` observable, as a set difference',
        ),
        intermediateCauseIsUnmatched: reviewerMarkdown.includes('is ALSO unmatched'),
        mutationIsTheVerdict: reviewerMarkdown.includes(
          '## 3. The mutation check — here it IS the verdict',
        ),
        revertTheFix: reviewerMarkdown.includes('**revert the fix and confirm the test fails.**'),
        entireProof: reviewerMarkdown.includes(
          'Here it is the ENTIRE proof that a\nreproduction ever happened',
        ),
        survivingTheRevertIsRework: reviewerMarkdown.includes(
          '**A test that\nsurvives the revert is `NEXT: rework`',
        ),
        narrowest: reviewerMarkdown.includes(
          '## 4. Is the fix the NARROWEST one that closes the bug?',
        ),
        wrongDepth: reviewerMarkdown.includes('The opposite failure is a fix at the wrong DEPTH'),
        rippleIsYours: reviewerMarkdown.includes('## 5. Did the ripple get checked?'),
        rereadTheUserRequest: reviewerMarkdown.includes(
          "**re-read `userRequest`, the bug report in the user's own words",
        ),
        quoteBothSentences: reviewerMarkdown.includes('quote BOTH sentences'),
      }).toStrictEqual({
        checks: ['1', '2', '3', '4', '5', '6'],
        coverageAsSetDifference: true,
        intermediateCauseIsUnmatched: true,
        mutationIsTheVerdict: true,
        revertTheFix: true,
        entireProof: true,
        survivingTheRevertIsRework: true,
        narrowest: true,
        wrongDepth: true,
        rippleIsYours: true,
        rereadTheUserRequest: true,
        quoteBothSentences: true,
      });
    });

    it('VALID: reviewerMarkdown => records an undrivable repro as a note rather than looping on it', () => {
      expect({
        heading: reviewerMarkdown.includes(
          '## An undrivable repro is recorded, not chased forever',
        ),
        openQuestion: reviewerMarkdown.includes(
          "`kind: 'open-question'` naming that observable id",
        ),
        leaveItOutOfRework: reviewerMarkdown.includes('leave it OUT of\n`NEXT: rework`'),
        soContinueCanCarryTheRest: reviewerMarkdown.includes(
          'so `continue` can carry the bugs that did reproduce',
        ),
      }).toStrictEqual({
        heading: true,
        openQuestion: true,
        leaveItOutOfRework: true,
        soContinueCanCarryTheRest: true,
      });
    });

    it('VALID: reviewerMarkdown => reports no sign-off track and still writes every disposition', () => {
      expect({
        noTrack: reviewerMarkdown.includes('## Sign-offs: there is no track on this discipline'),
        theExactField: reviewerMarkdown.includes('`SIGNOFFS: none — this discipline has no track`'),
        ratherThanDroppingIt: reviewerMarkdown.includes('rather than dropping the field'),
        nextCarriesTheOutcome: reviewerMarkdown.includes('let `NEXT:`\ncarry the entire outcome'),
        dispositionsStillWritten: reviewerMarkdown.includes('you still write every one'),
      }).toStrictEqual({
        noTrack: true,
        theExactField: true,
        ratherThanDroppingIt: true,
        nextCarriesTheOutcome: true,
        dispositionsStillWritten: true,
      });
    });
  });

  describe('budgets', () => {
    it('VALID: the three minion blocks => each stay inside their budget', () => {
      expect({
        planner: plannerMarkdown.length < 9_000,
        worker: workerMarkdown.length < 9_000,
        reviewer: reviewerMarkdown.length < 9_000,
      }).toStrictEqual({ planner: true, worker: true, reviewer: true });
    });
  });
});
