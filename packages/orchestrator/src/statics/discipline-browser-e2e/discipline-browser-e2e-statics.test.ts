import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { disciplineBrowserE2eStatics } from './discipline-browser-e2e-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineBrowserE2eStatics;

// The half of the reviewer block this file authored — the shared judging spine is governed by its
// own colocated test.
const AUTHORED_REVIEWER = reviewerMarkdown
  .split(flowEvidenceContractStatics.judgingMarkdown)
  .join('');

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

describe('disciplineBrowserE2eStatics', () => {
  it('VALID: exported value => carries exactly the four blocks, all non-empty strings', () => {
    expect(disciplineBrowserE2eStatics).toStrictEqual({
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

    // `RESOURCE: none` is the interesting one here: the server an e2e run needs comes up from the
    // project's Playwright `webServer` config and goes down with the run, so this operator is given
    // no dev server and needs none. Saying so is what stops it going looking for one.
    it('VALID: operatorMarkdown => is both fields as none, with the webServer explaining the first', () => {
      expect({
        resourceNoneDeliberate: operatorMarkdown.includes(
          '**RESOURCE:** none, and that is deliberate.',
        ),
        webServerConfig: operatorMarkdown.includes(
          "declared in the project's\nPlaywright `webServer` config",
        ),
        baseUrlRelative: operatorMarkdown.includes(
          'the specs navigate\n`baseURL`-relative so no URL ever reaches a test',
        ),
        resetNone: operatorMarkdown.includes('**RESET:** none.'),
        noScopeProse: operatorMarkdown.includes('runtime flow'),
        noDenominatorProse: operatorMarkdown.includes('denominator'),
        noEmptyRule: operatorMarkdown.includes('seeded in error'),
      }).toStrictEqual({
        resourceNoneDeliberate: true,
        webServerConfig: true,
        baseUrlRelative: true,
        resetNone: true,
        noScopeProse: false,
        noDenominatorProse: false,
        noEmptyRule: false,
      });
    });

    // The seeded-in-error answer moved to the session that RESOLVES the package set — the operator
    // cannot resolve it, so it could only have relayed a rule about a value it never sees.
    it('VALID: plannerMarkdown => owns the empty-package-set and zero-unit answers', () => {
      expect({
        seededInError: plannerMarkdown.includes(
          '**An EMPTY set means this item was seeded in\n   error**',
        ),
        zeroChunkPlan: plannerMarkdown.includes(
          'write a plan with zero chunks whose `SUMMARY` says exactly that',
        ),
        zeroUnitsSameAnswer: plannerMarkdown.includes('Zero units in scope gets the same answer.'),
        neitherIsAWall: plannerMarkdown.includes(
          'Neither is a wall, and neither is a\n   reason to widen anything.',
        ),
      }).toStrictEqual({
        seededInError: true,
        zeroChunkPlan: true,
        zeroUnitsSameAnswer: true,
        neitherIsAWall: true,
      });
    });
  });

  // On this discipline the proof is mostly MUTATION rather than red-first, because the behaviour a
  // walk covers usually already works — which is precisely why a worker template that hard-coded
  // red-first was wrong for four packs out of five.
  describe('workerMarkdown carries the two headings the worker template points at', () => {
    it('VALID: workerMarkdown => carries ### The work and ### The proof, work first', () => {
      expect({
        work: /^### The work$/mu.test(workerMarkdown),
        proof: /^### The proof$/mu.test(workerMarkdown),
        workFirst: workerMarkdown.indexOf('### The work') < workerMarkdown.indexOf('### The proof'),
      }).toStrictEqual({ work: true, proof: true, workFirst: true });
    });

    it('VALID: ### The work => walks every terminal and drives state through the UI', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        steps: Array.from(work.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        everyTerminal: work.includes('**One test per path** from the entry node to EVERY terminal'),
        allBranches: work.includes('cover ALL branches, success and failure'),
        happyPathIsTheFailure: work.includes(
          '*"I covered the happy path and stopped" is the\n   most common way this role fails',
        ),
        oneAssertionPerObservable: work.includes('**One assertion per observable**'),
        noToBeVisibleStandIn: work.includes('never a weaker `toBeVisible()` stand-in'),
        fullTransition: work.includes('**Assert the full transition**'),
        twoOfAnything: work.includes('**Seed two of anything an assertion must discriminate.**'),
        throughTheUi: work.includes('**Drive state through the UI, not around it.**'),
        preconditionSeedingIsFine: work.includes(
          'Seeding a PRECONDITION through the server or the\n   file system is fine',
        ),
        waitForElements: work.includes('**Wait for elements, never for a duration.**'),
        mayFixADefect: work.includes('**You may fix a genuine defect your walk exposes**'),
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **', '4. **', '5. **', '6. **', '7. **'],
        everyTerminal: true,
        allBranches: true,
        happyPathIsTheFailure: true,
        oneAssertionPerObservable: true,
        noToBeVisibleStandIn: true,
        fullTransition: true,
        twoOfAnything: true,
        throughTheUi: true,
        preconditionSeedingIsFine: true,
        waitForElements: true,
        mayFixADefect: true,
      });
    });

    it('VALID: ### The proof => leads on mutation, because the behaviour usually already works', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        watchItFail: proof.includes('**Watch each new case fail before you make it pass'),
        mostOfThem: proof.includes('which on this discipline is\nmost of them'),
        mutation: proof.includes('prove the test bites by MUTATION'),
        revertByEditing: proof.includes(
          'revert BY EDITING the line back (never `git checkout --`)',
        ),
        readsExactlyAsBefore: proof.includes('confirm the file\nreads exactly as it did before'),
        evidencePerUnit: proof.includes('`EVIDENCE` carries, per unit'),
        whatMakesItFail: proof.includes('**what makes\nit fail**'),
        saysWhichSource: proof.includes(
          'saying whether it came from red-first or from a mutation you reverted',
        ),
        theSentenceTest: proof.includes(
          '**An assertion you cannot name\na failing value for is a sentence that happens to be true, not a test.**',
        ),
      }).toStrictEqual({
        watchItFail: true,
        mostOfThem: true,
        mutation: true,
        revertByEditing: true,
        readsExactlyAsBefore: true,
        evidencePerUnit: true,
        whatMakesItFail: true,
        saysWhichSource: true,
        theSentenceTest: true,
      });
    });

    // Sibling items walk their own flows against this same tree, so a config or harness edit here is
    // last-write-wins across sessions the worker cannot see.
    it('VALID: workerMarkdown => bans editing the Playwright config or another flow harness', () => {
      expect({
        ban: workerMarkdown.includes(
          "**Never edit the Playwright config, and never edit a harness another flow's session owns.**",
        ),
        sameTree: workerMarkdown.includes(
          'Sibling\nitems walk their own flows against this same tree',
        ),
        lastWriteWins: workerMarkdown.includes('an edit there is last-write-wins'),
        sayInsteadOfReaching: workerMarkdown.includes(
          'say so in `GOTCHAS` rather than reaching for one',
        ),
      }).toStrictEqual({
        ban: true,
        sameTree: true,
        lastWriteWins: true,
        sayInsteadOfReaching: true,
      });
    });
  });

  // The extend-vs-add inventory is the load-bearing part of this role. A parallel suite standing
  // beside one that already covered the path is the most expensive mistake available here, and it is
  // invisible in a green run.
  describe('plannerMarkdown is inventory-first', () => {
    it('VALID: plannerMarkdown => runs the four inventory steps in order and decides PER UNIT', () => {
      expect({
        inventoryFirst: plannerMarkdown.includes('**Inventory before you author'),
        parallelSuiteIsTheMistake: plannerMarkdown.includes(
          'a parallel suite standing beside one that already covered the path\nis the most expensive mistake this role can make',
        ),
        steps: Array.from(plannerMarkdown.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        resolveByPackageType: plannerMarkdown.includes(
          '**Resolve the e2e-eligible packages from `packagesAffected` by `packageType`**',
        ),
        neverAssumeAPath: plannerMarkdown.includes(
          'Never\n   assume a package path from a name you recognised.',
        ),
        listEveryE2e: plannerMarkdown.includes('**List every `.e2e.ts` in those packages**'),
        openTheSpecs: plannerMarkdown.includes('**OPEN the specs whose `page.goto` target matches'),
        doNotCreditAFile: plannerMarkdown.includes('*Do not credit a file by its name'),
        perUnitNotPerFlow: plannerMarkdown.includes(
          '**Decide extend-vs-add PER UNIT, not per flow.**',
        ),
        threeVerdicts: plannerMarkdown.includes('**already\n   covered**'),
        verdictsAreThePlan: plannerMarkdown.includes('Those verdicts ARE the plan'),
      }).toStrictEqual({
        inventoryFirst: true,
        parallelSuiteIsTheMistake: true,
        steps: ['1. **', '2. **', '3. **', '4. **'],
        resolveByPackageType: true,
        neverAssumeAPath: true,
        listEveryE2e: true,
        openTheSpecs: true,
        doNotCreditAFile: true,
        perUnitNotPerFlow: true,
        threeVerdicts: true,
        verdictsAreThePlan: true,
      });
    });

    // This role hits the narrowing case on almost every run, because an e2e-and-harness file set has
    // no Jest counterpart. Writing the invocation here is what stops five sessions each guessing it.
    it('VALID: plannerMarkdown => writes the e2e ward invocation and forbids passWithNoTests', () => {
      expect({
        theInvocation: plannerMarkdown.includes(
          "**`WARD` per chunk: `npm run ward -- --only lint,typecheck,e2e -- <the chunk's files>`.**",
        ),
        noJestCounterpart: plannerMarkdown.includes('has no Jest counterpart'),
        everyChunk: plannerMarkdown.includes(
          'this is the invocation that applies on every\nchunk of this discipline',
        ),
        noPassWithNoTests: plannerMarkdown.includes('**Never reach for `--passWithNoTests`**'),
        mismatchIsAnAnswer: plannerMarkdown.includes(
          'that is ward answering the question,\nnot failing',
        ),
      }).toStrictEqual({
        theInvocation: true,
        noJestCounterpart: true,
        everyChunk: true,
        noPassWithNoTests: true,
        mismatchIsAnAnswer: true,
      });
    });

    it('VALID: plannerMarkdown => places a spec by its entry route and mines harnesses for levers', () => {
      expect({
        colocates: plannerMarkdown.includes('`<e2e-package>/src/flows/<route>/<feature>.e2e.ts`'),
        whereItStarts: plannerMarkdown.includes(
          'Where the test starts is where\nit lives, even when it bridges two UIs.',
        ),
        neverTheSameSpecPath: plannerMarkdown.includes(
          'Two chunks must never name the same spec path',
        ),
        leversNotFixtures: plannerMarkdown.includes(
          '## Mine the existing harnesses for LEVERS, not fixtures',
        ),
        readHarnessesFirst: plannerMarkdown.includes(
          '**Read `packages/*/test/harnesses/**` before you design a fault lever**',
        ),
        theMeasuredCost: plannerMarkdown.includes('one session lost\n2m11s relearning'),
      }).toStrictEqual({
        colocates: true,
        whereItStarts: true,
        neverTheSameSpecPath: true,
        leversNotFixtures: true,
        readHarnessesFirst: true,
        theMeasuredCost: true,
      });
    });

    it('VALID: plannerMarkdown => leaves the deeper layers to the sibling role and keeps the fixture rule', () => {
      expect({
        notTheWholeSuite: plannerMarkdown.includes(
          '**You are not the whole test suite for this flow.**',
        ),
        deeperIsAFalseGreen: plannerMarkdown.includes(
          'asserting a\nserver-side claim through the browser is a false green',
        ),
        offMapIsAnotherRole: plannerMarkdown.includes('**Off-map probe families**'),
        exceptTheFixtureRule: plannerMarkdown.includes(
          '**with one exception that never was a hand-off',
        ),
        noWebServerBlocksUnits: plannerMarkdown.includes(
          '**A resolved package declaring no `webServer` blocks every unit it owns.**',
        ),
      }).toStrictEqual({
        notTheWholeSuite: true,
        deeperIsAFalseGreen: true,
        offMapIsAnotherRole: true,
        exceptTheFixtureRule: true,
        noWebServerBlocksUnits: true,
      });
    });
  });

  // The judging spine is INTERPOLATED and the authoring half is deliberately absent: this pack's
  // worker does not need the modality-choice method, and carrying both put the same 8,281 characters
  // into two prompts at once.
  describe('the shared evidence contract', () => {
    it('VALID: reviewerMarkdown => opens on the judging half and carries no authoring half anywhere', () => {
      expect({
        judgingIsTheSpine: reviewerMarkdown.startsWith(flowEvidenceContractStatics.judgingMarkdown),
        reviewerAuthoring: reviewerMarkdown.includes(flowEvidenceContractStatics.authoringMarkdown),
        workerAuthoring: workerMarkdown.includes(flowEvidenceContractStatics.authoringMarkdown),
        workerJudging: workerMarkdown.includes(flowEvidenceContractStatics.judgingMarkdown),
      }).toStrictEqual({
        judgingIsTheSpine: true,
        reviewerAuthoring: false,
        workerAuthoring: false,
        workerJudging: false,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    // Two roles write the SAME field over DISJOINT package kinds, so signing one of these never
    // settles one of the sibling's units.
    it('VALID: reviewerMarkdown => signs flowriderSignoff over the disjoint complement, batched', () => {
      expect({
        sameFieldDisjoint: AUTHORED_REVIEWER.includes(
          'the sibling role writes the\nSAME field over the DISJOINT complement',
        ),
        neverSettlesTheSibling: AUTHORED_REVIEWER.includes(
          'signing one of yours never settles one of its units',
        ),
        confirmedBar: AUTHORED_REVIEWER.includes(
          '`confirmed` carries a test `file:line` PLUS what makes that test fail',
        ),
        unconfirmableBar: AUTHORED_REVIEWER.includes('`unconfirmable` carries what was tried'),
        batch: AUTHORED_REVIEWER.includes('**BATCH the writes**'),
        noWebServerIsUnconfirmable: AUTHORED_REVIEWER.includes(
          '**A resolved package with no `webServer` declaration blocks every unit it owns**',
        ),
        auditEveryOne: AUTHORED_REVIEWER.includes('**AUDIT EVERY `unconfirmable`'),
      }).toStrictEqual({
        sameFieldDisjoint: true,
        neverSettlesTheSibling: true,
        confirmedBar: true,
        unconfirmableBar: true,
        batch: true,
        noWebServerIsUnconfirmable: true,
        auditEveryOne: true,
      });
    });

    it('VALID: reviewerMarkdown => hunts the browser-specific false greens, including the config edit', () => {
      expect({
        wouldPassAgainstBroken: AUTHORED_REVIEWER.includes(
          'An assertion that would pass against a broken product.',
        ),
        hiddenTab: AUTHORED_REVIEWER.includes(
          '**A geometry or visibility finding taken from a hidden tab.**',
        ),
        toBeVisibleStandIn: AUTHORED_REVIEWER.includes(
          'A `toBeVisible()` standing in for an exact-text claim.',
        ),
        duplicateWalk: AUTHORED_REVIEWER.includes(
          'A spec that duplicates a path an existing spec already walked.',
        ),
        configEditIsRework: AUTHORED_REVIEWER.includes(
          '**A Playwright config or shared harness edited by this round.**',
        ),
        interceptBanBindsAuthoring: AUTHORED_REVIEWER.includes(
          'the intercept ban binds AUTHORED specs',
        ),
        impossiblyFastRun: AUTHORED_REVIEWER.includes(
          '**If a green run looks impossibly fast for the work it claims, do not accept it.**',
        ),
        discoveredIsNotRan: AUTHORED_REVIEWER.includes(
          'A "discovered" file count is\nnot a count of tests that ran.',
        ),
      }).toStrictEqual({
        wouldPassAgainstBroken: true,
        hiddenTab: true,
        toBeVisibleStandIn: true,
        duplicateWalk: true,
        configEditIsRework: true,
        interceptBanBindsAuthoring: true,
        impossiblyFastRun: true,
        discoveredIsNotRan: true,
      });
    });
  });

  describe('budgets', () => {
    it('VALID: the three minion blocks => each authored half stays inside its budget', () => {
      expect({
        planner: plannerMarkdown.length < 9_000,
        worker: workerMarkdown.length < 9_000,
        authoredReviewer: AUTHORED_REVIEWER.length < 9_000,
      }).toStrictEqual({ planner: true, worker: true, authoredReviewer: true });
    });
  });
});
