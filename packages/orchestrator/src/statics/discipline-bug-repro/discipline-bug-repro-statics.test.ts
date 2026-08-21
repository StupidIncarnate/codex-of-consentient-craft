import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { disciplineBugReproStatics } from './discipline-bug-repro-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineBugReproStatics;

// CROSS-FILE NEEDLES. Each one is read off the PRODUCING module's live value. A second copy of the
// same sentence written down here would drift exactly the way the prose drifts, and go quiet.

// The reviewer template's "What is not yours" entry holds both the ward ban and its carve-out. This
// pack's mutation check has to be a run that entry PERMITS rather than the one it bans.
const REVIEWER_TEMPLATE_NOT_YOURS = reviewerMinionStatics.prompt.template.slice(
  reviewerMinionStatics.prompt.template.indexOf('## What is not yours'),
  reviewerMinionStatics.prompt.template.indexOf('## What you return'),
);

// The reviewer template's return block DECLARES the exact form a discipline with no sign-off track
// reports its `SIGNOFFS` field in. Two packs carry that string verbatim, so it is extracted from
// the declaration rather than spelled a third time here.
const SIGNOFFS_NO_TRACK_DECLARATION =
  /^SIGNOFFS: <count and track, or "(?<noTrack>[^"]+)">$/mu.exec(
    reviewerMinionStatics.prompt.template,
  );

const SIGNOFFS_NO_TRACK_FIELD = `SIGNOFFS: ${SIGNOFFS_NO_TRACK_DECLARATION?.groups?.noTrack ?? ''}`;

// The structural-red catalogue, taken off the WORKER block's live value: the longest contiguous run
// of numbered lines in it, which is that list and nothing else. The reviewer block must carry that
// exact text. This is what makes the two blocks pin EACH OTHER rather than both being compared to a
// third hand-written copy that a joint reword would leave stale.
const WORKER_STRUCTURAL_RED_LIST = (workerMarkdown.match(/(?:^\d+\. .+\n)+/gmu) ?? []).find(
  (run) => run.trimEnd().split('\n').length === 6,
);

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

// `flowNodeContract` carries id, label, type, packages and observables. It has nowhere to put an
// actual-versus-expected flag, so the indicator lives in the node LABEL.
// `dumpsterHuntPromptStatics` writes those labels. Every block here reads them. Nothing typechecks
// that the two sides agree, so only this test keeps the spellings in agreement.
const ACTUAL_PREFIX = 'ACTUAL: <symptom today>';
const EXPECTED_PREFIX = 'EXPECTED: <what the fix must make real>';

// The worker's list decides whether it must repair its own test. The reviewer's list decides
// `NEXT: rework` versus `CHUNKS: accept`. A member in one list and not the other is a red the
// worker rejects and the grader has no name for, so both blocks carry these same six, spelled the
// same way.
const STRUCTURAL_RED_CATALOGUE = [
  '**These six reds are NOT a reproduction:**',
  '',
  '1. an import error',
  '2. a typo',
  '3. a missing fixture',
  '4. a selector that matches nothing',
  '5. a timeout reached before the assertion',
  '6. a setup that throws',
].join('\n');

// Nothing runs behind this reviewer, so a mutation check it forgets to undo ships a quest with the
// fix removed. `git checkout --` takes the whole file rather than the one line. The diff check is
// the only thing that proves the restore landed. The three sibling packs carry both requirements
// at this same step.
const MUTATION_CHECK_STEPS = [
  '1. **Revert the fix BY EDITING the line back.** Never `git checkout --`. Restore the old',
  '   expression, flip the condition back, or comment the changed line out.',
  '2. Run the test. Confirm it goes red for the right reason.',
  '3. Restore the fix. Watch the test pass again.',
  "4. **Confirm that file's diff is empty.** The diff check is what proves the fix went back on.",
].join('\n');

describe('disciplineBugReproStatics', () => {
  it('VALID: exported value => carries exactly the four blocks, all non-empty strings', () => {
    expect(disciplineBugReproStatics).toStrictEqual({
      operatorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  // The planner reads the flow to cut chunks from it. The reviewer reads it to rebuild the
  // denominator. Both must therefore spell the convention identically. The OPERATOR states it
  // nowhere. That is the two-field rule working: the operator opens no flow, so the spec shape is
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
    // report named. Nothing upstream split them. Nothing downstream picks up the one that got
    // skimmed. So how the planner divides them is the whole difference between a focused run and a
    // skim, and the PLANNER is the session that divides them. Telling the operator would have made
    // it a courier for a rule it cannot apply.
    it('VALID: plannerMarkdown => owns the one-item-every-bug framing the operator block used to hold', () => {
      expect({
        oneSessionEveryFlow: plannerMarkdown.includes(
          '**One session owns EVERY flow on this quest.**',
        ),
        noFanOut: plannerMarkdown.includes('The item does not fan out'),
        onlyPartitionThereWillBe: plannerMarkdown.includes(
          'You are the only session that will ever divide them into chunks.',
        ),
        readsTheQuestItself: plannerMarkdown.includes(
          "Read the quest yourself with `get-quest({ questId: 'QUEST_ID', format: 'json' })`",
        ),
      }).toStrictEqual({
        oneSessionEveryFlow: true,
        noFanOut: true,
        onlyPartitionThereWillBe: true,
        readsTheQuestItself: true,
      });
    });
  });

  // `userRequest` is the acceptance target on this discipline and it renders in exactly one place a
  // minion can reach: the JSON body of `get-quest`. `questToTextDisplayTransformer` emits no
  // `userRequest` section at all, `format` defaults to `'text'`, and a minion's brief carries no
  // Operation Context — so a call that omits the argument leaves both readers with no report to
  // check the tests against. `questSectionFilterTransformer` empties SECTIONS only, so the field
  // survives every `stage`.
  describe('both blocks that read the report name the JSON format at the call', () => {
    it('VALID: plannerMarkdown and reviewerMarkdown => pass format json, and say the text render omits userRequest', () => {
      expect({
        plannerCall: plannerMarkdown.includes(
          "`get-quest({ questId: 'QUEST_ID', format: 'json' })`",
        ),
        plannerSaysWhy: plannerMarkdown.includes(
          "**Pass\n`format: 'json'`.** The default text render omits `userRequest`",
        ),
        plannerLeavesNoBareCall: plannerMarkdown.includes("get-quest({ questId: 'QUEST_ID' })"),
        reviewerCall: reviewerMarkdown.includes(
          "`get-quest({ questId: 'QUEST_ID', format: 'json' })`",
        ),
        reviewerSaysWhy: reviewerMarkdown.includes(
          "**Pass `format: 'json'`.** The default text render omits `userRequest`,\nwhich section 6 needs.",
        ),
        reviewerLeavesNoBareCall: reviewerMarkdown.includes("get-quest({ questId: 'QUEST_ID' })"),
        reviewerSectionSixNamesTheSource: reviewerMarkdown.includes(
          'Read\n`userRequest` from the JSON response of the `get-quest` call at the top of this block.',
        ),
        reviewerSaysTheBriefLacksIt: reviewerMarkdown.includes(
          'The text render never emits it. Your brief carries only the header,\nthe plan path and the worker returns.',
        ),
      }).toStrictEqual({
        plannerCall: true,
        plannerSaysWhy: true,
        plannerLeavesNoBareCall: false,
        reviewerCall: true,
        reviewerSaysWhy: true,
        reviewerLeavesNoBareCall: false,
        reviewerSectionSixNamesTheSource: true,
        reviewerSaysTheBriefLacksIt: true,
      });
    });
  });

  // This discipline INVERTS the usual red step. The product already exists and already runs, so
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
          'the product code your chunk targets already\nexists and already runs. What is wrong is what it DOES.',
        ),
        nothingToShell: workerMarkdown.includes('There is nothing to shell out.'),
        redOnUnchangedSource: workerMarkdown.includes(
          '**Your red comes from the real system misbehaving on unchanged\nsource.**',
        ),
        assertTheObservable: workerMarkdown.includes('**Assert THAT sentence**'),
        neverAnIntermediateCause: workerMarkdown.includes(
          'Never assert an intermediate\ncause you found on the way to it',
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
          '**Write the failing test FIRST, before you open the implementation.**',
        ),
        beforeYouPlanTheEdit: work.includes('before you plan the edit'),
        aFixInYourHeadPicksTheAssertion: work.includes(
          'A fix already formed in your head selects an assertion that fits the\n   FIX rather than the BUG',
        ),
        writesItsOwnE2e: work.includes(
          '**Writing that `.e2e.ts` yourself is part of this discipline**',
        ),
        narrowestChange: work.includes('Apply the NARROWEST change'),
        atItsRealCause: work.includes('**at its real\n   cause**'),
        resistTheRewrite: work.includes('Resist the rewrite'),
        biggerFixIsRework: work.includes('that is `NEXT: rework` with what\n   you found'),
        deleteTheProbes: work.includes('Delete every temporary `process.stderr.write` probe'),
        rippleCheck: work.includes('**Watch it pass, then ripple-check.**'),
        loosenedTestGoesGreenOverTheBug: work.includes(
          'A test you loosened goes green over a bug that is still there',
        ),
        smallFixChecksTheRippleToo: work.includes('**Run that check on a one-line fix too**'),
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
        loosenedTestGoesGreenOverTheBug: true,
        smallFixChecksTheRippleToo: true,
      });
    });

    // The most expensive mistake on this discipline: a structural red reproduces nothing, and the
    // fix that "makes it pass" fixes the TEST. Everything downstream then reads green and no later
    // session re-checks it, because this quest type's relay tail is two ward runs and nothing else.
    it('VALID: ### The proof => demands an ASSERTION red whose value matches the reported symptom', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        theWholeGate: proof.includes(
          '**Between steps 1 and 2, watch it fail for the RIGHT REASON.** Nothing else on this quest checks\nthat your test ever failed.',
        ),
        againstUnchangedSource: proof.includes('Run it against UNCHANGED source.'),
        fromYourAssertion: proof.includes('Does the failure come from YOUR ASSERTION'),
        matchesTheActualSymptom: proof.includes(
          'Does the actual value it prints match the `ACTUAL:` symptom',
        ),
        structuralIsNotAReproduction: proof.includes(STRUCTURAL_RED_CATALOGUE),
        fixesTheTest: proof.includes(
          'The fix that "makes\nit pass" fixes the TEST rather than the bug',
        ),
        mostExpensiveMistake: proof.includes(
          'This is the most expensive mistake available on this\ndiscipline',
        ),
        noLaterSessionRechecks: proof.includes('No later session re-checks that verdict.'),
        theTestIsBroken: proof.includes('When the red is structural, the TEST is broken'),
        keepGoing: proof.includes('Keep going until the red is an ASSERTION red'),
        captureTheOutput: proof.includes('**Capture that output.**'),
        cannotDoItFromItFailed: proof.includes('It cannot do that from "it failed".'),
        cannotReproduceIsAFinding: proof.includes(
          '**If you cannot reproduce the bug as described at all, that is a FINDING, not a failure.**',
        ),
        strandsNoSignal: proof.includes(
          'under `spike-tmp/`, which is gitignored. What you drove is then still\nreadable by the next session.',
        ),
        neverReportAnUnseenRed: proof.includes('**Never report a red you did not see.**'),
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
        strandsNoSignal: true,
        neverReportAnUnseenRed: true,
      });
    });

    // The planner promises that a corrected reading of the symptom survives into the next `pt N`.
    // The commit body is the only channel that carries it, and the generic worker template says
    // only "The body says what you did". Without a marker named here, nothing writes it and the
    // successor re-derives the correction from scratch.
    it('VALID: workerMarkdown => carries the CORRECTED commit marker the planner points at by name', () => {
      expect({
        heading: workerMarkdown.includes('### The `CORRECTED:` commit marker is yours to write'),
        firstLineOfTheBody: workerMarkdown.includes(
          'One situation puts a marker on **the first line of your commit BODY**:',
        ),
        theRow: workerMarkdown.includes(
          '| Fixed a bug whose real symptom differs from the report | `CORRECTED:` |',
        ),
        bothReadings: workerMarkdown.includes(
          'That note names both readings: what the report\nclaims, and what your planner drove',
        ),
        onlyPlaceASuccessorReadsIt: workerMarkdown.includes(
          'That line is the only place a\n`pt N` successor can read the correction back.',
        ),
        subjectUnchanged: workerMarkdown.includes('The subject stays `chunk <n>: <title>`.'),
        plannerNamesTheMarker: plannerMarkdown.includes(
          "Say in the owning chunk's `NOTES` that its worker leads the commit\nbody with `CORRECTED:`.",
        ),
      }).toStrictEqual({
        heading: true,
        firstLineOfTheBody: true,
        theRow: true,
        bothReadings: true,
        onlyPlaceASuccessorReadsIt: true,
        subjectUnchanged: true,
        plannerNamesTheMarker: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    it('VALID: plannerMarkdown => partitions by bug first and orders the repro chunk before the fix', () => {
      expect({
        oneFlowPerBug: plannerMarkdown.includes('Your spec is **ONE FLOW PER BUG**'),
        flowCountIsBugCount: plannerMarkdown.includes('The flow count IS the bug\ncount.'),
        observablesOnExpectedOnly: plannerMarkdown.includes('EXPECTED side ONLY'),
        forkNamesTheDivergence: plannerMarkdown.includes('The fork node names the divergence'),
        todayEdge: plannerMarkdown.includes('| `today` | `ACTUAL: <symptom today>` |'),
        afterFixEdge: plannerMarkdown.includes(
          '| `after fix` | `EXPECTED: <what the fix must make real>` |',
        ),
        cutOnTheFlowBoundary: plannerMarkdown.includes('Cut on the FLOW boundary first'),
        skimIsInvisible: plannerMarkdown.includes(
          'Nobody\nsees the skim, because the half it skimmed has no failing test.',
        ),
        reproBeforeFix: plannerMarkdown.includes(
          'the chunk that writes the reproducing test must be\nnumbered BEFORE the chunk that fixes it',
        ),
        fixFirstProvesNothing: plannerMarkdown.includes(
          'A fix that arrives first leaves nothing red to prove the bug was ever real.',
        ),
        // `plannerMinionStatics` sends its reader here for the denominator — "Your discipline names
        // the call. It also says plainly when there is no denominator at all." A block that names
        // the call but never says the word leaves that pointer unresolved, and the reviewer block
        // one over already says "They are your denominator" of the same set.
        namesItsDenominator: plannerMarkdown.includes(
          '**The `EXPECTED:` observables across every flow are your denominator.**',
        ),
        cutsChunksFromThatList: plannerMarkdown.includes('Cut your chunks from that\nlist.'),
      }).toStrictEqual({
        oneFlowPerBug: true,
        flowCountIsBugCount: true,
        observablesOnExpectedOnly: true,
        forkNamesTheDivergence: true,
        todayEdge: true,
        afterFixEdge: true,
        cutOnTheFlowBoundary: true,
        skimIsInvisible: true,
        reproBeforeFix: true,
        fixFirstProvesNothing: true,
        namesItsDenominator: true,
        cutsChunksFromThatList: true,
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
          'That is routinely not the file the defect is in.',
        ),
        stopAtAFileLine: plannerMarkdown.includes('Stop only when you can name a `file:line`'),
        diagnosticNotKept: plannerMarkdown.includes('**Your spike is DIAGNOSTIC here, not kept.**'),
        spikeLivesUnderSpikeTmp: plannerMarkdown.includes(
          'Write a throwaway assertion under `spike-tmp/`, which is gitignored.',
        ),
        doItYourself: plannerMarkdown.includes('Never spawn a sub-agent for that spike.'),
        noGateRereadsIt: plannerMarkdown.includes(
          "No gate downstream ever re-reads a sub-agent's conclusion\nabout where a bug lives.",
        ),
        removeTheProbe: plannerMarkdown.includes(
          'Remove every probe you added to product\ncode before you return.',
        ),
        reportWrongIsAFinding: plannerMarkdown.includes(
          '**A bug that turns out to be different from the report is a FINDING, not a wall.**',
        ),
      }).toStrictEqual({
        establishWhereItLives: true,
        visibleIsNotWhereItIs: true,
        stopAtAFileLine: true,
        diagnosticNotKept: true,
        spikeLivesUnderSpikeTmp: true,
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
          'A paraphrase is how a test ends up asserting something\n  adjacent',
        ),
        notesNamesTheLayer: plannerMarkdown.includes('**`NOTES`** names the LAYER'),
        defaultToE2e: plannerMarkdown.includes(
          'Default to e2e for any "I don\'t see X in the UI" report.',
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
    // observable uses up the whole chain and blocks the quest on the bugs that DID get fixed.
    it('VALID: plannerMarkdown => refuses to re-plan a repro a previous round already failed the same way', () => {
      expect({
        heading: plannerMarkdown.includes('## When this item has become a wall'),
        worthOneRound: plannerMarkdown.includes(
          '**A repro nobody could drive is worth ONE `rework` round, not a chain of them.**',
        ),
        readThePreviousCommits: plannerMarkdown.includes(
          'read the previous `review <n>:` commit bodies',
        ),
        doNotPlanItAgain: plannerMarkdown.includes('do NOT plan\nit again'),
        letTheReviewerRecordIt: plannerMarkdown.includes(
          '3. Let the reviewer record the undrivable one as an open question.',
        ),
        repeatingBlocksTheQuest: plannerMarkdown.includes(
          'Plan it again and you spend the whole chain. The quest then blocks on the bugs you already fixed.',
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

  // The relay tail on a bug-hunt quest is `ward(changed) → ward(full)` and nothing else, and there
  // is no sign-off track — so `signal-back` recomputes no sign-off denominator here. Its
  // review-coverage gate is a separate gate and it DOES bind, because that gate reads its
  // membership from `Object.keys(roleToDisciplineStatics)` and `pesteater` is in that map. No
  // session opens these files after this reviewer, which is why its block is the longest one in the
  // pack and why the mutation check is the verdict rather than one signal among several.
  describe('reviewerMarkdown is the last gate on this quest type', () => {
    it('VALID: reviewerMarkdown => says nothing runs behind it, and never takes the red on trust', () => {
      expect({
        nothingRunsBehind: reviewerMarkdown.includes('**Nothing runs behind this discipline.**'),
        theRelayTail: reviewerMarkdown.includes('`ward(changed) → ward(full)` and nothing else'),
        // Two gates, one of which binds. `signoffOutstandingTransformer` returns nothing for
        // `pesteater`, so there is no sign-off denominator to recompute. The review-coverage gate
        // takes its membership from `Object.keys(roleToDisciplineStatics)`, which carries
        // `pesteater`, so it DOES refuse `done` over a missing disposition. A block telling this
        // reviewer that nothing refuses `done` is what makes the dispositions look optional.
        noSignoffDenominator: reviewerMarkdown.includes(
          '`signal-back` recomputes no sign-off denominator on this\ndiscipline. It gates nothing on one.',
        ),
        reviewCoverageGateDoesBind: reviewerMarkdown.includes(
          "Its REVIEW-COVERAGE gate is a different gate. **That one refuses your parent's `done` while any\nreview unit carries no disposition.**",
        ),
        onlyThingStanding: reviewerMarkdown.includes(
          '**Here you are the last session that\nopens these files before the quest ends.**',
        ),
        neverOnTrust: reviewerMarkdown.includes(
          "Never close a round on a worker's word that it went red\nfirst.",
        ),
        reDeriveTheRed: reviewerMarkdown.includes(
          '## 2. Re-derive the red yourself, never take it',
        ),
        unverifiedByConstruction: reviewerMarkdown.includes(
          'So "I watched it fail first" is unverified by',
        ),
      }).toStrictEqual({
        nothingRunsBehind: true,
        theRelayTail: true,
        noSignoffDenominator: true,
        reviewCoverageGateDoesBind: true,
        onlyThingStanding: true,
        neverOnTrust: true,
        reDeriveTheRed: true,
        unverifiedByConstruction: true,
      });
    });

    it('VALID: reviewerMarkdown => grades the same six structural reds the worker refuses', () => {
      expect({
        reviewerCatalogue: reviewerMarkdown.includes(STRUCTURAL_RED_CATALOGUE),
        workerCatalogue: workerMarkdown.includes(STRUCTURAL_RED_CATALOGUE),
        importError: STRUCTURAL_RED_CATALOGUE.includes('1. an import error'),
        typo: STRUCTURAL_RED_CATALOGUE.includes('2. a typo'),
        missingFixture: STRUCTURAL_RED_CATALOGUE.includes('3. a missing fixture'),
        selector: STRUCTURAL_RED_CATALOGUE.includes('4. a selector that matches nothing'),
        timeout: STRUCTURAL_RED_CATALOGUE.includes('5. a timeout reached before the assertion'),
        setupThatThrows: STRUCTURAL_RED_CATALOGUE.includes('6. a setup that throws'),
        reproducedNothing: reviewerMarkdown.includes('A structural red reproduced nothing.'),
      }).toStrictEqual({
        reviewerCatalogue: true,
        workerCatalogue: true,
        importError: true,
        typo: true,
        missingFixture: true,
        selector: true,
        timeout: true,
        setupThatThrows: true,
        reproducedNothing: true,
      });
    });

    // STRENGTHENS the shared-constant pin above, which compares BOTH blocks to a third copy written
    // at the top of this file. This one takes the WORKER block's list off its live value and
    // requires the reviewer block to carry that exact text, so the two blocks pin each other: a
    // reword of either alone fails here even if nobody remembers the constant exists. This is the
    // pair that already drifted once — "a selector that matches nothing" versus "a selector
    // matching nothing" — after a fix pass had deliberately made them agree.
    //
    // What breaks if they diverge: the worker's list decides whether it must repair its own test,
    // the reviewer's decides `NEXT: rework` versus `CHUNKS: accept`. A member in one list and not
    // the other is a red the worker rejects and the grader has no name for.
    it('VALID: the six structural reds => are ONE list, spelled identically in the worker and the reviewer', () => {
      expect({
        workerListFound: WORKER_STRUCTURAL_RED_LIST !== undefined,
        workerListMemberCount: String(WORKER_STRUCTURAL_RED_LIST).trimEnd().split('\n').length,
        reviewerCarriesTheWorkerListVerbatim: reviewerMarkdown.includes(
          String(WORKER_STRUCTURAL_RED_LIST),
        ),
        theHandWrittenPinStillMatchesTheLiveList: STRUCTURAL_RED_CATALOGUE.endsWith(
          String(WORKER_STRUCTURAL_RED_LIST).trimEnd(),
        ),
        occurrencesPerBlock: [
          workerMarkdown.split(String(WORKER_STRUCTURAL_RED_LIST)).length - 1,
          reviewerMarkdown.split(String(WORKER_STRUCTURAL_RED_LIST)).length - 1,
        ],
      }).toStrictEqual({
        workerListFound: true,
        workerListMemberCount: 6,
        reviewerCarriesTheWorkerListVerbatim: true,
        theHandWrittenPinStillMatchesTheLiveList: true,
        occurrencesPerBlock: [1, 1],
      });
    });

    // CROSS-FILE PAIR — `reviewerMinionStatics`' "What is not yours" ward entry ←→ this pack's §3
    // mutation check. That entry BANS a second round-scoped ward and, inside the same bullet,
    // EXEMPTS a revert-to-see-whether-a-test-fails and a run over one test, then defers to whatever
    // the discipline requires as proof. §3 requires exactly that run, per bug, and calls it the
    // ENTIRE proof that a reproduction ever happened. It asks for no round-scoped ward of its own,
    // which is why `--staged` must not appear in this block at all.
    //
    // What breaks if they diverge: the reviewer reads its own template as forbidding the only
    // evidence this discipline has. It skips the mutation check — and on a quest type whose relay
    // tail is two ward runs and nothing else, a test that would pass against the BROKEN code is
    // accepted with no session left to re-check it.
    it('VALID: the per-bug mutation check => is a run the reviewer template exempts from its ward ban', () => {
      expect({
        templateBansASecondRoundScopedWard: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          '**A SECOND round-scoped ward.**',
        ),
        templateExemptsAOneFileOrOneTestRun: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          '**A run over ONE file or ONE test is not on this list.**',
        ),
        templatePermitsARevertToSeeATestFail: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          '- you revert a line to see whether a test fails;',
        ),
        templateDefersToTheDiscipline: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          'Your discipline above may require one as proof.',
        ),
        packRevertsByEditingRatherThanCheckout: reviewerMarkdown.includes(
          '1. **Revert the fix BY EDITING the line back.** Never `git checkout --`.',
        ),
        packRunsThatOneTest: reviewerMarkdown.includes(
          '2. Run the test. Confirm it goes red for the right reason.',
        ),
        packCallsThatRunTheEntireProof: reviewerMarkdown.includes(
          'Here it is the ENTIRE proof that a\nreproduction ever happened',
        ),
        packAsksForARoundScopedWardOfItsOwn: reviewerMarkdown.includes('--staged'),
      }).toStrictEqual({
        templateBansASecondRoundScopedWard: true,
        templateExemptsAOneFileOrOneTestRun: true,
        templatePermitsARevertToSeeATestFail: true,
        templateDefersToTheDiscipline: true,
        packRevertsByEditingRatherThanCheckout: true,
        packRunsThatOneTest: true,
        packCallsThatRunTheEntireProof: true,
        packAsksForARoundScopedWardOfItsOwn: false,
      });
    });

    it('VALID: reviewerMarkdown => reverts the mutation by editing, and confirms the file diff is empty', () => {
      expect({
        fourSteps: reviewerMarkdown.includes(MUTATION_CHECK_STEPS),
        byEditingNotCheckout: reviewerMarkdown.includes(
          '**Revert the fix BY EDITING the line back.** Never `git checkout --`.',
        ),
        theDiffCheckProvesTheRestore: reviewerMarkdown.includes(
          'The diff check is what proves the fix went back on.',
        ),
        unshipsTheFix: reviewerMarkdown.includes(
          'Skip step 4 and you can commit your verdict over a fix you removed. Nobody runs after you to\nnotice.',
        ),
      }).toStrictEqual({
        fourSteps: true,
        byEditingNotCheckout: true,
        theDiffCheckProvesTheRestore: true,
        unshipsTheFix: true,
      });
    });

    it('VALID: reviewerMarkdown => runs its six numbered checks, with the mutation check as the verdict', () => {
      expect({
        checks: Array.from(reviewerMarkdown.matchAll(/^## (\d)\. /gmu)).map((match) => match[1]),
        coverageIsOneTestPerObservable: reviewerMarkdown.includes(
          '## 1. One test per `EXPECTED:` observable',
        ),
        intermediateCauseIsUnmatched: reviewerMarkdown.includes(
          "A test\nthat asserts an intermediate cause instead of the observable's own `description` leaves that\nobservable uncovered.",
        ),
        mutationIsTheVerdict: reviewerMarkdown.includes(
          '## 3. The mutation check IS the verdict here',
        ),
        revertTheFix: reviewerMarkdown.includes(
          'Run these four steps on every test this round added. Work through one bug at a time:',
        ),
        entireProof: reviewerMarkdown.includes(
          'Here it is the ENTIRE proof that a\nreproduction ever happened',
        ),
        survivingTheRevertIsRework: reviewerMarkdown.includes(
          '**A test that survives the revert is `NEXT: rework`',
        ),
        narrowest: reviewerMarkdown.includes(
          '## 4. Is the fix the NARROWEST one that closes the bug?',
        ),
        wrongDepth: reviewerMarkdown.includes('The opposite failure is a fix at the wrong DEPTH'),
        rippleIsYours: reviewerMarkdown.includes('## 5. Check the ripple yourself'),
        rereadTheUserRequest: reviewerMarkdown.includes(
          "**Re-read `userRequest`, the bug report in the user's own\nwords.**",
        ),
        quoteBothSentences: reviewerMarkdown.includes('Quote BOTH sentences'),
      }).toStrictEqual({
        checks: ['1', '2', '3', '4', '5', '6'],
        coverageIsOneTestPerObservable: true,
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
          '## Record an undrivable repro rather than chasing it forever',
        ),
        openQuestion: reviewerMarkdown.includes(
          "`kind: 'open-question'` naming that observable id",
        ),
        leaveItOutOfRework: reviewerMarkdown.includes('Leave it OUT of\n`NEXT: rework`'),
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
        nextCarriesTheOutcome: reviewerMarkdown.includes('Let `NEXT:`\ncarry the entire outcome'),
        dispositionsStillWritten: reviewerMarkdown.includes('**You still write every one.**'),
        // The consequence spelled out, in the shape `disciplineImplementationStatics` uses: the
        // gate recomputes over every commit the work item made, so an empty unit refuses the
        // signal. The pt chain is the half that differs — this seed carries no `locked` override
        // in `questTypeRegistryStatics`, so it defaults true and the chain is bounded.
        recomputedOverEveryCommit: reviewerMarkdown.includes(
          "Your parent's `done` is RECOMPUTED against it over every\ncommit this work item made, so a unit you leave empty refuses that signal.",
        ),
        boundedPtChainBlocksTheQuest: reviewerMarkdown.includes(
          'so its pt chain is BOUNDED rather than unbounded. A signal refused round after round ends the item\nas `partial`. A spent chain blocks the whole quest.',
        ),
      }).toStrictEqual({
        noTrack: true,
        theExactField: true,
        ratherThanDroppingIt: true,
        nextCarriesTheOutcome: true,
        dispositionsStillWritten: true,
        recomputedOverEveryCommit: true,
        boundedPtChainBlocksTheQuest: true,
      });
    });

    // CROSS-FILE PAIR — `reviewerMinionStatics`' return block ←→ this pack's sign-off section. The
    // template's `SIGNOFFS:` line DECLARES the fixed string a discipline with no track reports; the
    // needle here is extracted from that declaration rather than written down a second time, and
    // this pack must carry it verbatim and spell it no other way. `disciplineImplementationStatics`
    // carries the identical string and its own test derives it the same way.
    //
    // What breaks if they diverge: the field is the operator's only evidence that a track was
    // considered rather than forgotten. An invented spelling reads as a real count, and a dropped
    // field reads as a reviewer that skipped the question.
    it("VALID: reviewerMarkdown => reports SIGNOFFS in the reviewer template's own declared no-track form", () => {
      expect({
        templateStillDeclaresTheNoTrackForm: SIGNOFFS_NO_TRACK_DECLARATION !== null,
        packCarriesItVerbatim: reviewerMarkdown.includes(SIGNOFFS_NO_TRACK_FIELD),
        packSpellsItNoOtherWay: Array.from(reviewerMarkdown.matchAll(/SIGNOFFS:[^`\n]*/gu)).map(
          (match) => match[0],
        ),
      }).toStrictEqual({
        templateStillDeclaresTheNoTrackForm: true,
        packCarriesItVerbatim: true,
        packSpellsItNoOtherWay: [SIGNOFFS_NO_TRACK_FIELD],
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
