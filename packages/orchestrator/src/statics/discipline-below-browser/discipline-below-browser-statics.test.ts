import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { signoffTrackEligibilityStatics } from '../signoff-track-eligibility/signoff-track-eligibility-statics';
import { disciplineBelowBrowserStatics } from './discipline-below-browser-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineBelowBrowserStatics;

// Two blocks interpolate a shared spine. These constants hold only the half this file authors.
const AUTHORED_WORKER = workerMarkdown
  .split(flowEvidenceContractStatics.authoringMarkdown)
  .join('');
const AUTHORED_REVIEWER = reviewerMarkdown
  .split(flowEvidenceContractStatics.judgingMarkdown)
  .join('');

// A tool named in an operator's discipline block reads to that session as a permission. The operator
// template's table says so in as many words. Every name below sits on that template's FORBIDDEN half.
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

describe('disciplineBelowBrowserStatics', () => {
  it('VALID: exported value => carries exactly the four blocks, all non-empty strings', () => {
    expect(disciplineBelowBrowserStatics).toStrictEqual({
      operatorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
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

    // Both fields read "none". Saying so is the whole block. The package-slice framing this block
    // used to carry was material the operator could only forward: it reads its own slice off
    // `Your packages:` in `$ARGUMENTS`, generated from the operation item. Its planner reads that
    // framing first-hand below.
    it('VALID: operatorMarkdown => is both fields as none, and restates no scope of its own', () => {
      expect({
        resourceNone: operatorMarkdown.includes('**RESOURCE:** none.'),
        namesWhyNoServer: operatorMarkdown.includes(
          'Your workers start no dev server, because a suite below the browser needs none.',
        ),
        resetNone: operatorMarkdown.includes('**RESET:** none.'),
        noSliceProse: operatorMarkdown.includes('PACKAGE SLICE'),
        noDenominatorProse: operatorMarkdown.includes('denominator'),
        noEmptyRule: operatorMarkdown.includes('zero units'),
      }).toStrictEqual({
        resourceNone: true,
        namesWhyNoServer: true,
        resetNone: true,
        noSliceProse: false,
        noDenominatorProse: false,
        noEmptyRule: false,
      });
    });

    // The empty-checklist answer did not vanish. It moved to the planner, which is the session that
    // makes the call and the only one that could widen it.
    it('VALID: plannerMarkdown => owns the empty-checklist answer and the ban on widening', () => {
      expect({
        emptyIsReal: plannerMarkdown.includes(
          '**An EMPTY checklist is a real state, not an error.**',
        ),
        zeroChunks: plannerMarkdown.includes(
          'Zero units in your slice means a plan with zero\nchunks.',
        ),
        doNotWiden: plannerMarkdown.includes(
          '**Do NOT widen the call to find something to cover.**',
        ),
      }).toStrictEqual({ emptyIsReal: true, zeroChunks: true, doNotWiden: true });
    });
  });

  describe('workerMarkdown carries the two headings the worker template points at', () => {
    it('VALID: workerMarkdown => carries ### The work and ### The proof, work first', () => {
      expect({
        work: /^### The work$/mu.test(workerMarkdown),
        proof: /^### The proof$/mu.test(workerMarkdown),
        workFirst: workerMarkdown.indexOf('### The work') < workerMarkdown.indexOf('### The proof'),
      }).toStrictEqual({ work: true, proof: true, workFirst: true });
    });

    it('VALID: ### The work => authors Jest suites against real systems, never a mock of the subject', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        steps: Array.from(work.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        modalityPerObservable: work.includes('**Choose the modality per OBSERVABLE**'),
        neverAMockOfTheSubject: work.includes('never a mock of the system under test'),
        everyTerminal: work.includes(
          '**Write one test per path to EVERY terminal. Write one per branch taken.**',
        ),
        errorIsFirstClass: work.includes('is a first-class path, never optional'),
        happyPathIsTheFailure: work.includes(
          '"I covered the happy path and stopped"\n   is how this discipline fails',
        ),
        fixturesThatCanFail: work.includes('**Seed fixtures that can fail.**'),
        closeAHole: work.includes('**Close an implementation hole your own testing exposes.**'),
        redFirst: work.includes('**Fix it\n   RED-FIRST.**'),
        architecturalIsRework: work.includes(
          'Hand these four up in `NEXT: rework`, leaving the proving test red:\n\n   - an architectural fix',
        ),
        neverBendTheImplementation: work.includes(
          '**Never bend the implementation to make a test pass.**',
        ),
        noPlaywrightNoServer: work.includes('**You author NO Playwright. You start no server.**'),
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **', '4. **'],
        modalityPerObservable: true,
        neverAMockOfTheSubject: true,
        everyTerminal: true,
        errorIsFirstClass: true,
        happyPathIsTheFailure: true,
        fixturesThatCanFail: true,
        closeAHole: true,
        redFirst: true,
        architecturalIsRework: true,
        neverBendTheImplementation: true,
        noPlaywrightNoServer: true,
      });
    });

    // Where red-first is impossible because the behaviour already works, the proof is a MUTATION.
    // The worker breaks the line, captures the red, then reverts by EDITING it back.
    // `git checkout --` is on every minion's destructive-git ban. The last step confirms the file's
    // diff is empty.
    it('VALID: ### The proof => demands a witnessed red or a reverted mutation, and what makes it fail', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        witnessedRed: proof.includes('**witnessed red**'),
        perUnit: proof.includes('`EVIDENCE` carries that red per unit'),
        theOtherFour: proof.includes('alongside the\nother four items of the evidence contract'),
        whatMakesItFail: proof.includes('**what makes it fail**'),
        mutationWhenRedFirstIsImpossible: proof.includes('prove the test bites by\nMUTATION'),
        revertByEditing: proof.includes(
          'Revert BY EDITING the line back. Never `git checkout --`.',
        ),
        confirmDiffEmpty: proof.includes('Confirm `git diff` on that file is empty.'),
        sayWhichOne: proof.includes(
          'For each unit, say which of the two you did — the witnessed red, or the mutation.',
        ),
        notAnAnswer: proof.includes('"Fails if the text is wrong" is not an answer'),
        nameTheFailingValue: proof.includes(
          '**Name the specific wrong value\nfor every assertion you write.**',
        ),
      }).toStrictEqual({
        witnessedRed: true,
        perUnit: true,
        theOtherFour: true,
        whatMakesItFail: true,
        mutationWhenRedFirstIsImpossible: true,
        revertByEditing: true,
        confirmDiffEmpty: true,
        sayWhichOne: true,
        notAnAnswer: true,
        nameTheFailingValue: true,
      });
    });

    // The checklist call takes an `operationItemId`, so it narrows to the PACKAGE SLICE. That slice
    // is the whole operation item, never this worker's chunk of it. A worker reading the returned
    // list as its own scope would write outside its `FILES` against a sibling worker. It would also
    // report the sibling chunks' units as uncovered, spending a round on work the plan scheduled.
    it('VALID: workerMarkdown => takes unit TEXT from the tool and its SCOPE from its chunk', () => {
      expect({
        textFromToolScopeFromChunk: workerMarkdown.includes(
          '**The checklist gives you the unit TEXT. Your chunk gives you the SCOPE.**',
        ),
        toolReturnsTheWholeSlice: workerMarkdown.includes('It returns the whole PACKAGE SLICE'),
        listIsWiderThanTheChunk: workerMarkdown.includes(
          '**That list is WIDER than your chunk. The surplus belongs to a sibling worker.**',
        ),
        scopeIsTheIntersection: workerMarkdown.includes(
          "INTERSECTION: the entries whose ids your chunk's `UNITS` names, over the bundle of flows its\n`NOTES` names.",
        ),
        widerScopeRacesTheSibling: workerMarkdown.includes(
          "You write outside your `FILES` to cover a sibling's unit. The later write wins, so one of you\n   loses the work.",
        ),
        widerScopeBurnsARound: workerMarkdown.includes(
          "You report a sibling's unit as uncovered in `NEXT: rework`. That spends a round on a chunk the\n   plan already scheduled.",
        ),
        verbatimLabels: workerMarkdown.includes('never from a paraphrase'),
        pathsTruncated: workerMarkdown.includes(
          '`pathsTruncated: true` — the path list is INCOMPLETE',
        ),
        remainingIsNotScope: workerMarkdown.includes(
          "`remainingItemIds` — your parent's gate count. It is never your scope.",
        ),
        signsNothing: workerMarkdown.includes('**You sign NOTHING.**'),
        whySigningWouldBeCircular: workerMarkdown.includes(
          "If you signed a unit,\nyour parent's completion gate would clear the moment you returned.",
        ),
      }).toStrictEqual({
        textFromToolScopeFromChunk: true,
        toolReturnsTheWholeSlice: true,
        listIsWiderThanTheChunk: true,
        scopeIsTheIntersection: true,
        widerScopeRacesTheSibling: true,
        widerScopeBurnsARound: true,
        verbatimLabels: true,
        pathsTruncated: true,
        remainingIsNotScope: true,
        signsNothing: true,
        whySigningWouldBeCircular: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    it('VALID: plannerMarkdown => carries the unit-routing and filter rules the operator block used to relay', () => {
      expect({
        itemsAreWider: plannerMarkdown.includes('**`items` is WIDER than the observables.**'),
        terminalsAreUnits: plannerMarkdown.includes(
          'Terminals and labelled branches are units too.',
        ),
        everyUnitInOneChunk: plannerMarkdown.includes(
          '**Every unit that call returns lands in exactly one chunk.**',
        ),
        routingByNode: plannerMarkdown.includes(
          '**A package slice does NOT own the seams. The seam slice does NOT own the per-package units.**',
        ),
        crossingCostsTheBudget: plannerMarkdown.includes(
          "spends your parent's budget on units a sibling item is already gated on.\nYour own slice then reaches the reviewer with units no chunk covers.",
        ),
        operationalNotYours: plannerMarkdown.includes('**Operational flows are not yours.**'),
        browserNotYours: plannerMarkdown.includes(
          '**The browser is not yours. Playwright is not yours either.**',
        ),
      }).toStrictEqual({
        itemsAreWider: true,
        terminalsAreUnits: true,
        everyUnitInOneChunk: true,
        routingByNode: true,
        crossingCostsTheBudget: true,
        operationalNotYours: true,
        browserNotYours: true,
      });
    });

    it('VALID: plannerMarkdown => bundles by efficiency, names harnesses by full path, and writes the ward line', () => {
      expect({
        bundleNotOneFlow: plannerMarkdown.includes(
          'A chunk is a BUNDLE of flows, never one flow apiece.',
        ),
        sharedSurface: plannerMarkdown.includes('**Shared surface or harness**'),
        sharedLayer: plannerMarkdown.includes('**Shared layer**'),
        coupledObservables: plannerMarkdown.includes('**Coupled observables**'),
        splitTooBig: plannerMarkdown.includes('**Split anything too big for one worker.**'),
        skimIsInvisible: plannerMarkdown.includes('The skim is invisible in a green run'),
        earlierOwnsTheHarness: plannerMarkdown.includes('the EARLIER-NUMBERED one owns it'),
        fullPathNotConcept: plannerMarkdown.includes('**by FULL PATH, never by concept**'),
        wardLine: plannerMarkdown.includes(
          '**`WARD` per chunk:** `--only lint,typecheck,unit,integration`',
        ),
        neverE2e: plannerMarkdown.includes(
          'Never `e2e`. No chunk on this discipline authors Playwright.',
        ),
      }).toStrictEqual({
        bundleNotOneFlow: true,
        sharedSurface: true,
        sharedLayer: true,
        coupledObservables: true,
        splitTooBig: true,
        skimIsInvisible: true,
        earlierOwnsTheHarness: true,
        fullPathNotConcept: true,
        wardLine: true,
        neverE2e: true,
      });
    });

    // The planner template tells this session that its discipline decides the spike's disposal. A
    // pack saying nothing leaves the one minion allowed to spawn a sub-agent guessing about the only
    // thing it may spawn one for. `spike-tmp/` is gitignored, which keeps a spike out of the
    // operator's step-7 `git status` sweep.
    it('VALID: plannerMarkdown => keeps a spike, under gitignored spike-tmp, named in the chunk NOTES', () => {
      expect({
        kept: plannerMarkdown.includes('## Spikes are KEPT on this discipline'),
        whyKept: plannerMarkdown.includes(
          'A harness recipe you got working is the pattern its worker extends, never a probe you throw away.',
        ),
        whenToSpike: plannerMarkdown.includes(
          'Spike when reading cannot tell you whether a route, a queue, a spawned process or a real file system\ncan be driven from a Jest test at all.',
        ),
        spikeTmpAndGitignored: plannerMarkdown.includes(
          'Leave the working driver under `spike-tmp/`, which is\ngitignored.',
        ),
        namedInNotes: plannerMarkdown.includes("Name that\npath in the owning chunk's `NOTES`."),
        untrackedRefusesTheSignal: plannerMarkdown.includes(
          "The\nserver then refuses your parent's `signal-back`, because an untracked file leaves the worktree\ndirty.",
        ),
      }).toStrictEqual({
        kept: true,
        whyKept: true,
        whenToSpike: true,
        spikeTmpAndGitignored: true,
        namedInNotes: true,
        untrackedRefusesTheSignal: true,
      });
    });

    // Copying the units by hand costs most of the planner's turn. It also puts a transcription error
    // between the spec and the test. The worker calls the same narrowed tool with the same ids.
    it('VALID: plannerMarkdown => refuses to transcribe the units and lists what the tool cannot know', () => {
      expect({
        doNotTranscribe: plannerMarkdown.includes(
          '## Do NOT transcribe the observables into the chunk briefs',
        ),
        sameNarrowedList: plannerMarkdown.includes('It gets the SAME narrowed list you did'),
        transcriptionError: plannerMarkdown.includes(
          'puts a transcription error between the spec and the test',
        ),
        whatTheToolCannotKnow: plannerMarkdown.includes(
          'What `NOTES` carries is what the tool CANNOT know',
        ),
        designDecisionRationale: plannerMarkdown.includes(
          "**An observable's text says what to assert. Its design\ndecision says what goes wrong if you assert it the easy way.**",
        ),
        openTheTestFiles: plannerMarkdown.includes(
          '## Inventory what already covers each flow, by OPENING THE TEST FILES',
        ),
        neverCreditAFilename: plannerMarkdown.includes('**Do not credit a filename'),
        theMeasuredFalseGreen: plannerMarkdown.includes(
          'named three test files in a commit message.\nIt had opened none of them. That shipped a false green.',
        ),
      }).toStrictEqual({
        doNotTranscribe: true,
        sameNarrowedList: true,
        transcriptionError: true,
        whatTheToolCannotKnow: true,
        designDecisionRationale: true,
        openTheTestFiles: true,
        neverCreditAFilename: true,
        theMeasuredFalseGreen: true,
      });
    });
  });

  // The two shared blocks are INTERPOLATED, never copied. A copy would let the method a worker
  // authors by drift away from the criteria a reviewer rejects by. Neither session could ever notice.
  describe('the shared evidence contract is interpolated, split by who needs which half', () => {
    it('VALID: workerMarkdown => carries the authoring half and not the judging half', () => {
      expect({
        authoring: workerMarkdown.includes(flowEvidenceContractStatics.authoringMarkdown),
        judging: workerMarkdown.includes(flowEvidenceContractStatics.judgingMarkdown),
      }).toStrictEqual({ authoring: true, judging: false });
    });

    it('VALID: reviewerMarkdown => carries the judging half and not the authoring half', () => {
      expect({
        judging: reviewerMarkdown.includes(flowEvidenceContractStatics.judgingMarkdown),
        authoring: reviewerMarkdown.includes(flowEvidenceContractStatics.authoringMarkdown),
        judgingIsTheSpine: reviewerMarkdown.startsWith(flowEvidenceContractStatics.judgingMarkdown),
      }).toStrictEqual({ judging: true, authoring: false, judgingIsTheSpine: true });
    });

    // PAIR: `flowEvidenceContractStatics`' two halves and the four blocks this file authors. The
    // two pins above prove the WHOLE half is interpolated. Neither can see a PARAPHRASE of one of
    // its sections sitting alongside it, which is how a copy starts. The section headings are read
    // off the shared block itself, so a heading renamed there is a heading renamed here.
    it('VALID: the four blocks => restate none of the shared halves own sections', () => {
      const judgingHeadings = Array.from(
        flowEvidenceContractStatics.judgingMarkdown.matchAll(/^## .+$/gmu),
      ).flatMap((match) => match.slice(0, 1));
      const authoringHeadings = Array.from(
        flowEvidenceContractStatics.authoringMarkdown.matchAll(/^## .+$/gmu),
      ).flatMap((match) => match.slice(0, 1));
      const authored = [operatorMarkdown, plannerMarkdown, AUTHORED_WORKER, AUTHORED_REVIEWER];

      expect({
        judgingHasSectionsToCopy: judgingHeadings.length > 0,
        authoringHasSectionsToCopy: authoringHeadings.length > 0,
        judgingSectionsRestatedHere: judgingHeadings.filter((heading) =>
          authored.some((block) => block.includes(heading)),
        ),
        authoringSectionsRestatedHere: authoringHeadings.filter((heading) =>
          authored.some((block) => block.includes(heading)),
        ),
      }).toStrictEqual({
        judgingHasSectionsToCopy: true,
        authoringHasSectionsToCopy: true,
        judgingSectionsRestatedHere: [],
        authoringSectionsRestatedHere: [],
      });
    });
  });

  describe('reviewerMarkdown', () => {
    // The reviewer signs and the worker does not. The FIELD is shared even so. The eligibility
    // statics give `flowrider` and `groundstomper` the same `signoffField` over disjoint
    // `packageTypes`, so this block claims the package slice rather than the whole track.
    it('VALID: reviewerMarkdown => signs this slice rather than the whole field, batched, and rebuilds its own denominator', () => {
      expect({
        reviewerSignsWorkerDoesNot: AUTHORED_REVIEWER.includes("## You sign this track's units"),
        notAnInstruction: AUTHORED_REVIEWER.includes(
          'That is\nstructural rather than a promise it was trusted to keep',
        ),
        theSliceNotTheField: AUTHORED_REVIEWER.includes(
          '**Your units are the PACKAGE SLICE your brief names, never the whole `flowriderSignoff` field.**',
        ),
        siblingOwnsTheComplement: AUTHORED_REVIEWER.includes(
          'sibling role writes that SAME field over the browser-reachable package kinds. Those kinds are the\nDISJOINT complement of your slice.',
        ),
        neitherSettlesTheOther: AUTHORED_REVIEWER.includes(
          "So signing one of your units never settles one of the sibling's.",
        ),
        signingTheirsIsAFalseGreen: AUTHORED_REVIEWER.includes(
          'Signing one of ITS units is a false green: you opened no browser, so you cannot confirm a\nbrowser-reachable claim.',
        ),
        rebuildItYourself: AUTHORED_REVIEWER.includes(
          'Your denominator is every unit in your slice. Rebuild it yourself with',
        ),
        idAndFieldOnly: AUTHORED_REVIEWER.includes('Send the id and the sign-off field ONLY.'),
        batch: AUTHORED_REVIEWER.includes('**BATCH the writes.**'),
        theCostOfNotBatching: AUTHORED_REVIEWER.includes(
          'Signing 45\nunits one at a time costs 45 quest writes',
        ),
        e2eIsNeverEvidence: AUTHORED_REVIEWER.includes(
          '**A Playwright `.e2e.ts` is never evidence on this track.**',
        ),
      }).toStrictEqual({
        reviewerSignsWorkerDoesNot: true,
        notAnInstruction: true,
        theSliceNotTheField: true,
        siblingOwnsTheComplement: true,
        neitherSettlesTheOther: true,
        signingTheirsIsAFalseGreen: true,
        rebuildItYourself: true,
        idAndFieldOnly: true,
        batch: true,
        theCostOfNotBatching: true,
        e2eIsNeverEvidence: true,
      });
    });

    // `signoffTrackEligibilityStatics.byTrack.flowrider.unitKinds` is terminal / branch / observable.
    // Only `siegemaster` carries `off-map`. So `offMapSignoffs` is another role's patch target. A
    // sign-off sent there settles a unit this session never measured.
    it('VALID: reviewerMarkdown => patches observables, nodes and edges, and never offMapSignoffs', () => {
      expect({
        patchTargets: AUTHORED_REVIEWER.includes(
          'patching `{ id, flowriderSignoff }` onto the\nobservable, node or edge through `modify-quest`',
        ),
        offMapIsNotADenominator: AUTHORED_REVIEWER.includes(
          '**The off-map probe families are not on your denominator.**',
        ),
        offMapBelongsToAnotherRole: AUTHORED_REVIEWER.includes(
          'Another role probes security, performance\nand the other off-map families by hand against a running system.',
        ),
        neverPatchOffMapSignoffs: AUTHORED_REVIEWER.includes(
          "`offMapSignoffs` is that role's\npatch target. A patch you send there signs a unit you never measured.",
        ),
      }).toStrictEqual({
        patchTargets: true,
        offMapIsNotADenominator: true,
        offMapBelongsToAnotherRole: true,
        neverPatchOffMapSignoffs: true,
      });
    });

    // Nothing server-side reopens an UNSIGNED unit. The gate refuses the parent's `done` while one
    // exists. A permanently unprovable unit left blank therefore spends the pt chain to its budget.
    // It then blocks the quest. An honest `unconfirmable` clears the gate. A blank never does. The
    // audit exists for exactly that gap.
    it('VALID: reviewerMarkdown => routes an unprovable unit to unconfirmable and audits every one', () => {
      expect({
        notLeftUnsigned: AUTHORED_REVIEWER.includes('Never leave it unsigned.'),
        nothingReopensABlank: AUTHORED_REVIEWER.includes(
          'Nothing server-side reopens an unsigned unit',
        ),
        spendsTheChain: AUTHORED_REVIEWER.includes(
          'spends the pt chain to its budget. It then blocks the quest.',
        ),
        auditEveryOne: AUTHORED_REVIEWER.includes(
          "**AUDIT EVERY `unconfirmable`, a predecessor's included.**",
        ),
        assignmentNotWall: AUTHORED_REVIEWER.includes(
          'Reopen any whose evidence names an\nASSIGNMENT rather than a WALL',
        ),
        whatYouReopenYouOwn: AUTHORED_REVIEWER.includes('A\nunit you reopen is yours to settle.'),
      }).toStrictEqual({
        notLeftUnsigned: true,
        nothingReopensABlank: true,
        spendsTheChain: true,
        auditEveryOne: true,
        assignmentNotWall: true,
        whatYouReopenYouOwn: true,
      });
    });

    // PAIR: `flowEvidenceContractStatics.judgingMarkdown` — interpolated as the spine of this very
    // block — and the words this file authors underneath it. ONE rule, two wordings: a unit nobody
    // can settle after real effort is `unconfirmable`, carrying evidence AND a `question`, while a
    // unit merely awaiting a test nobody has written is not `unconfirmable` at all. The verdict
    // token and the spine's own clause are READ off the spine, so a reword of either side fails
    // this one test. Diverge and this reviewer leaves the unit blank: nothing server-side reopens
    // it, the sign-off gate refuses its parent's `done`, the round spends the pt chain to its
    // budget, and the quest blocks.
    it('VALID: reviewerMarkdown + judgingMarkdown => route an unsettleable unit to the same verdict, and a deferral back out of it', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const opener = 'after real effort is `';
      const closer = '`.** Sign it with';
      const verdict = judgingMarkdown.slice(
        judgingMarkdown.indexOf(opener) + opener.length,
        judgingMarkdown.indexOf(closer),
      );
      const spineClause = judgingMarkdown.slice(
        judgingMarkdown.indexOf('**A unit nobody can settle'),
        judgingMarkdown.indexOf(closer) + 1,
      );

      expect({
        verdict,
        spineClause,
        spineRefusesABlank: judgingMarkdown.includes('Never leave it blank.'),
        spineSaysTheVerdictClears: judgingMarkdown.includes(
          `An honest \`${verdict}\` clears\nthe gate. A blank never does.`,
        ),
        spineKeepsAnUnwrittenTestOut: judgingMarkdown.includes(
          `needs a test nobody has written yet is NOT \`${verdict}\`.**`,
        ),
        packRestatesTheSpinesClause: AUTHORED_REVIEWER.includes(spineClause),
        packSaysTheVerdictClears: AUTHORED_REVIEWER.includes(
          `An honest \`${verdict}\` CLEARS that gate. A blank one never does.`,
        ),
        packSendsADeferralToTheAudit: AUTHORED_REVIEWER.includes(
          `A session can also defer real\nwork by writing \`${verdict}\`, which is why the audit below exists.`,
        ),
      }).toStrictEqual({
        verdict: 'unconfirmable',
        spineClause: '**A unit nobody can settle after real effort is `unconfirmable`',
        spineRefusesABlank: true,
        spineSaysTheVerdictClears: true,
        spineKeepsAnUnwrittenTestOut: true,
        packRestatesTheSpinesClause: true,
        packSaysTheVerdictClears: true,
        packSendsADeferralToTheAudit: true,
      });
    });

    // PAIR: `signoffTrackEligibilityStatics.byTrack` — the data the completion gate itself reads —
    // and this block's claim about what it signs. The FIELD NAME comes off the statics rather than
    // a copy, and so does the split that makes the claim honest: `flowrider` and `groundstomper`
    // carry the SAME `signoffField` over DISJOINT `packageTypes` (a merged set that loses no member
    // is what disjoint MEANS). That disjointness is the only reason this block may claim a SLICE
    // rather than the field. It once claimed the whole field, which is this reviewer signing
    // browser-reachable units it never opened a browser for — a false green the sibling role's own
    // gate then reads as settled.
    it('VALID: reviewerMarkdown + signoffTrackEligibilityStatics => claim the slice of the shared field this track is assigned', () => {
      const { flowrider, groundstomper, siegemaster } = signoffTrackEligibilityStatics.byTrack;
      const field = flowrider.signoffField;
      const bothTracksKinds = [...flowrider.packageTypes, ...groundstomper.packageTypes];
      // Deduped rather than compared with `===`. TypeScript narrows both fields to the same literal,
      // so a direct comparison reads as always-true and lint deletes the check.
      const bothTracksFields = [flowrider.signoffField, groundstomper.signoffField];

      expect({
        theSiblingWritesTheSameField: new Set(bothTracksFields).size === 1,
        theTwoTracksShareNoPackageKind: new Set(bothTracksKinds).size === bothTracksKinds.length,
        namesTheSliceNotTheField: AUTHORED_REVIEWER.includes(
          `**Your units are the PACKAGE SLICE your brief names, never the whole \`${field}\` field.**`,
        ),
        patchesThatField: AUTHORED_REVIEWER.includes(`patching \`{ id, ${field} }\` onto the`),
        claimsTheOtherTracksField: AUTHORED_REVIEWER.includes(siegemaster.signoffField),
      }).toStrictEqual({
        theSiblingWritesTheSameField: true,
        theTwoTracksShareNoPackageKind: true,
        namesTheSliceNotTheField: true,
        patchesThatField: true,
        claimsTheOtherTracksField: false,
      });
    });

    // The reviewer must state the sample's size and its ids. An unnamed sample reads to the next
    // session as "all of this was checked".
    it('VALID: reviewerMarkdown => runs a structural pass on everything and a named sample of the rest', () => {
      expect({
        passA: AUTHORED_REVIEWER.includes('**Pass A — structural, on 100% of claims.**'),
        noExcuseToSample: AUTHORED_REVIEWER.includes(
          'Sample none of it. Pass A is cheap and mechanical.',
        ),
        passB: AUTHORED_REVIEWER.includes('**Pass B — semantic, by opening the file.**'),
        mandatoryNoSampling: AUTHORED_REVIEWER.includes('MANDATORY, no sampling, for'),
        namedSample: AUTHORED_REVIEWER.includes('**NAMED random sample of the remainder**'),
        unnamedSampleMisreads: AUTHORED_REVIEWER.includes(
          'An\nunnamed sample reads to the next session as "all of this was checked".',
        ),
      }).toStrictEqual({
        passA: true,
        noExcuseToSample: true,
        passB: true,
        mandatoryNoSampling: true,
        namedSample: true,
        unnamedSampleMisreads: true,
      });
    });

    it('VALID: reviewerMarkdown => binds the intercept ban to this track, because it is authoring', () => {
      expect({
        settledHere: AUTHORED_REVIEWER.includes(
          'This rule is settled here. Two roles read it and reached opposite verdicts on six units.',
        ),
        theBan: AUTHORED_REVIEWER.includes('**A suite\nmust not `page.route` its own backend.**'),
        handDrivenMay: AUTHORED_REVIEWER.includes(
          'A hand-driven MEASUREMENT in a live browser MAY',
        ),
        bindsYou: AUTHORED_REVIEWER.includes(
          '**Never sign a unit `confirmed` on evidence from an intercepted route.**',
        ),
      }).toStrictEqual({ settledHere: true, theBan: true, handDrivenMay: true, bindsYou: true });
    });
  });

  describe('budgets', () => {
    it('VALID: the three minion blocks => each authored half stays inside its budget', () => {
      expect({
        planner: plannerMarkdown.length < 9_000,
        authoredWorker: AUTHORED_WORKER.length < 9_000,
        authoredReviewer: AUTHORED_REVIEWER.length < 9_000,
      }).toStrictEqual({ planner: true, authoredWorker: true, authoredReviewer: true });
    });
  });
});
