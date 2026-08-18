import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { disciplineBelowBrowserStatics } from './discipline-below-browser-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineBelowBrowserStatics;

// The authored half of each block that interpolates a shared spine — the part this file owns.
const AUTHORED_WORKER = workerMarkdown
  .split(flowEvidenceContractStatics.authoringMarkdown)
  .join('');
const AUTHORED_REVIEWER = reviewerMarkdown
  .split(flowEvidenceContractStatics.judgingMarkdown)
  .join('');

// A tool named in an operator's discipline block is a GRANT — the operator template's table says so
// in as many words. Every name here is on that template's FORBIDDEN half.
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

    // Both fields are "none", and saying so is the whole content. The package-slice framing this
    // block used to carry was material the operator could only forward: it reads its own slice off
    // `Your packages:` in `$ARGUMENTS`, generated from the operation item, and its planner reads the
    // framing first-hand below.
    it('VALID: operatorMarkdown => is both fields as none, and restates no scope of its own', () => {
      expect({
        resourceNone: operatorMarkdown.includes('**RESOURCE:** none.'),
        namesWhyNoServer: operatorMarkdown.includes(
          "This track's suites need no dev server and start none",
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

    // The empty-checklist answer did not vanish, it moved to the session that makes the call and is
    // therefore the only one that could be tempted to widen it.
    it('VALID: plannerMarkdown => owns the empty-checklist answer and the ban on widening', () => {
      expect({
        emptyIsReal: plannerMarkdown.includes(
          '**An EMPTY checklist is a real state, not an error.**',
        ),
        zeroChunks: plannerMarkdown.includes('Zero units in your slice means a plan with zero'),
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
          '**One test per path to EVERY terminal, and every branch taken.**',
        ),
        errorIsFirstClass: work.includes('is a first-class path, never optional'),
        happyPathIsTheFailure: work.includes(
          '"I covered the happy path and stopped" is how this\n   discipline fails',
        ),
        fixturesThatCanFail: work.includes('**Seed fixtures that can fail.**'),
        closeAHole: work.includes('**Close an implementation hole your own testing exposes.**'),
        redFirst: work.includes('**Fix it\n   RED-FIRST**'),
        architecturalIsRework: work.includes(
          'goes in `NEXT: rework` with its proving test left red',
        ),
        neverBendTheImplementation: work.includes(
          '**Never bend the implementation to make a test pass**',
        ),
        noPlaywrightNoServer: work.includes(
          '**You author NO Playwright and you start no server.**',
        ),
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

    // Where red-first is impossible because the behaviour already works, the proof is a MUTATION —
    // break the line, capture the red, revert by EDITING (never `git checkout --`, which is on every
    // minion's destructive-git ban), and confirm the file's diff is empty.
    it('VALID: ### The proof => demands a witnessed red or a reverted mutation, and what makes it fail', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        witnessedRed: proof.includes('**witnessed red**'),
        perUnit: proof.includes('`EVIDENCE` carries it per unit'),
        theOtherFour: proof.includes('other four items of the evidence contract'),
        whatMakesItFail: proof.includes('**what makes it fail**'),
        mutationWhenRedFirstIsImpossible: proof.includes('prove the test bites by\nMUTATION'),
        revertByEditing: proof.includes(
          'revert BY EDITING the\nline back — never `git checkout --`',
        ),
        confirmDiffEmpty: proof.includes('confirm `git diff` on that file is empty'),
        sayWhichOne: proof.includes('Say which of\nthe two you did.'),
        notAnAnswer: proof.includes('"Fails if the text is wrong" is not an answer'),
        theSentenceTest: proof.includes(
          '**An agent that cannot say what\nwould make its assertion fail has not written a test',
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
        theSentenceTest: true,
      });
    });

    it('VALID: workerMarkdown => takes its scope from the tool and signs nothing', () => {
      expect({
        scopeFromATool: workerMarkdown.includes(
          '**Your scope comes from a tool, not from prose.**',
        ),
        oneArgumentIsTheScope: workerMarkdown.includes(
          'that one argument carries the track, the flows and the package slice',
        ),
        verbatimLabels: workerMarkdown.includes('never from a\nparaphrase'),
        pathsTruncated: workerMarkdown.includes(
          '`pathsTruncated: true` means the path list is INCOMPLETE',
        ),
        remainingIsNotScope: workerMarkdown.includes(
          "`remainingItemIds` is your parent's gate count, not your scope",
        ),
        signsNothing: workerMarkdown.includes('**You sign NOTHING.**'),
        whySigningWouldBeCircular: workerMarkdown.includes(
          'a signature from the\nsession that wrote the test would satisfy the gate the moment you returned',
        ),
      }).toStrictEqual({
        scopeFromATool: true,
        oneArgumentIsTheScope: true,
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
        itemsAreWider: plannerMarkdown.includes('**`items` is WIDER than the observables.'),
        terminalsAreUnits: plannerMarkdown.includes(
          'Terminals and labelled branches are units too**',
        ),
        everyUnitInOneChunk: plannerMarkdown.includes(
          '**Every unit it returns lands in exactly one chunk**',
        ),
        routingByNode: plannerMarkdown.includes(
          '**A package slice does NOT own the seams, and the seam slice does NOT own the per-package units.**',
        ),
        crossingCostsTheBudget: plannerMarkdown.includes(
          "spends your parent's budget on units a sibling item is\ngated on",
        ),
        operationalNotYours: plannerMarkdown.includes('**Operational flows are not yours.**'),
        browserNotYours: plannerMarkdown.includes(
          '**The browser is not yours and neither is Playwright.**',
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
        splitTooBig: plannerMarkdown.includes('**Split anything too big to hold.**'),
        skimIsInvisible: plannerMarkdown.includes('the skim is invisible in a green run'),
        earlierOwnsTheHarness: plannerMarkdown.includes('the EARLIER-NUMBERED one owns it'),
        fullPathNotConcept: plannerMarkdown.includes('**by FULL PATH, never by concept**'),
        wardLine: plannerMarkdown.includes(
          '**`WARD` per chunk:** `--only lint,typecheck,unit,integration`',
        ),
        neverE2e: plannerMarkdown.includes(
          'Never `e2e` — no chunk on this discipline authors Playwright.',
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

    // Copying the units by hand costs most of the planner's turn AND puts a transcription error
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
          "**An observable's text says what to assert; its design decision says what\ngoes wrong if you assert it the easy way.**",
        ),
        openTheTestFiles: plannerMarkdown.includes(
          '## Inventory what already covers each flow — BY OPENING THE TEST FILES',
        ),
        neverCreditAFilename: plannerMarkdown.includes('**Do not credit a filename'),
        theMeasuredFalseGreen: plannerMarkdown.includes(
          'naming three test files in a\ncommit message having opened none of them',
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

  // The two shared blocks are INTERPOLATED, never copied: a copy would let the method a worker
  // authors by and the criteria a reviewer rejects by drift apart silently, which is the one drift
  // neither session could detect.
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
  });

  describe('reviewerMarkdown', () => {
    it('VALID: reviewerMarkdown => is the only writer of the track, batched, and rebuilds its own denominator', () => {
      expect({
        onlyWriter: AUTHORED_REVIEWER.includes(
          '## You are the only writer of the `flowriderSignoff` track',
        ),
        notAnInstruction: AUTHORED_REVIEWER.includes(
          'That is not an instruction\nit was trusted to keep — it is the shape of the pipeline',
        ),
        rebuildItYourself: AUTHORED_REVIEWER.includes('Rebuild the denominator yourself'),
        idAndFieldOnly: AUTHORED_REVIEWER.includes('the id and the\nsign-off field ONLY'),
        batch: AUTHORED_REVIEWER.includes('**BATCH the writes.**'),
        theCostOfNotBatching: AUTHORED_REVIEWER.includes(
          '45 units\nsigned one at a time is 45 quest writes',
        ),
        e2eIsNeverEvidence: AUTHORED_REVIEWER.includes(
          '**A Playwright `.e2e.ts` is never evidence on this track.**',
        ),
      }).toStrictEqual({
        onlyWriter: true,
        notAnInstruction: true,
        rebuildItYourself: true,
        idAndFieldOnly: true,
        batch: true,
        theCostOfNotBatching: true,
        e2eIsNeverEvidence: true,
      });
    });

    // Nothing server-side reopens an UNSIGNED unit — the gate refuses the parent's `done` while one
    // exists, so a permanently unprovable unit left blank burns the pt chain and blocks the quest.
    // `unconfirmable` clears; a blank never does. Which is exactly why the audit exists.
    it('VALID: reviewerMarkdown => routes an unprovable unit to unconfirmable and audits every one', () => {
      expect({
        notLeftUnsigned: AUTHORED_REVIEWER.includes('not left unsigned'),
        nothingReopensABlank: AUTHORED_REVIEWER.includes(
          'Nothing server-side reopens an unsigned unit',
        ),
        burnsTheChain: AUTHORED_REVIEWER.includes(
          'burns the pt chain to its budget and blocks the quest',
        ),
        auditEveryOne: AUTHORED_REVIEWER.includes(
          "**AUDIT EVERY `unconfirmable`, a predecessor's included.**",
        ),
        assignmentNotWall: AUTHORED_REVIEWER.includes(
          'Reopen any whose evidence names an\nASSIGNMENT rather than a WALL',
        ),
        whatYouReopenYouOwn: AUTHORED_REVIEWER.includes('What you reopen, you own.'),
      }).toStrictEqual({
        notLeftUnsigned: true,
        nothingReopensABlank: true,
        burnsTheChain: true,
        auditEveryOne: true,
        assignmentNotWall: true,
        whatYouReopenYouOwn: true,
      });
    });

    // A sample you do not name is a silent cap, and reads to the next session as "all of this was
    // checked".
    it('VALID: reviewerMarkdown => runs a structural pass on everything and a named sample of the rest', () => {
      expect({
        passA: AUTHORED_REVIEWER.includes('**Pass A — structural, on 100% of claims.**'),
        noExcuseToSample: AUTHORED_REVIEWER.includes('so there is no excuse to sample\nit'),
        passB: AUTHORED_REVIEWER.includes('**Pass B — semantic, by opening the file.**'),
        mandatoryNoSampling: AUTHORED_REVIEWER.includes('MANDATORY, no sampling, for'),
        namedSample: AUTHORED_REVIEWER.includes('**NAMED random sample of the remainder**'),
        silentCap: AUTHORED_REVIEWER.includes('*A sample\nyou do not name is a silent cap'),
      }).toStrictEqual({
        passA: true,
        noExcuseToSample: true,
        passB: true,
        mandatoryNoSampling: true,
        namedSample: true,
        silentCap: true,
      });
    });

    it('VALID: reviewerMarkdown => binds the intercept ban to this track, because it is authoring', () => {
      expect({
        settledHere: AUTHORED_REVIEWER.includes(
          'Two roles read this rule and reached opposite verdicts on six units, so it is settled here.',
        ),
        theBan: AUTHORED_REVIEWER.includes('**A\nsuite must not `page.route` its own backend.**'),
        handDrivenMay: AUTHORED_REVIEWER.includes(
          'A hand-driven MEASUREMENT in a live browser MAY',
        ),
        bindsYou: AUTHORED_REVIEWER.includes(
          '**never sign a unit `confirmed` on evidence from an\nintercepted route.**',
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
