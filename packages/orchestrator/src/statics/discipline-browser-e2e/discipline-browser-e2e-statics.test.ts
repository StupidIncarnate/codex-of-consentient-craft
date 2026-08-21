import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { signoffTrackEligibilityStatics } from '../signoff-track-eligibility/signoff-track-eligibility-statics';
import { disciplineBrowserE2eStatics } from './discipline-browser-e2e-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineBrowserE2eStatics;

// The half of the reviewer block this file authored. Its interpolated judging half is governed by
// its own colocated test.
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

    // `RESOURCE: none` is deliberate here. The server an e2e run needs comes up from the project's
    // Playwright `webServer` config. It goes down with the run. This operator is therefore given no
    // dev server. It does not go looking for one, because the block says so.
    it('VALID: operatorMarkdown => reads none on both fields, with the webServer explaining the first', () => {
      expect({
        resourceNoneDeliberate: operatorMarkdown.includes(
          '**RESOURCE:** none. That is deliberate.',
        ),
        webServerConfig: operatorMarkdown.includes(
          "declared in the project's\nPlaywright `webServer` config",
        ),
        runStartsAndStopsIt: operatorMarkdown.includes(
          'The run starts it. The same run stops it at the end.',
        ),
        baseUrlRelative: operatorMarkdown.includes(
          'No URL ever reaches a test, because the specs navigate\n`baseURL`-relative.',
        ),
        resetNone: operatorMarkdown.includes('**RESET:** none.'),
        noScopeProse: operatorMarkdown.includes('runtime flow'),
        noDenominatorProse: operatorMarkdown.includes('denominator'),
        noEmptyRule: operatorMarkdown.includes('seeded in error'),
      }).toStrictEqual({
        resourceNoneDeliberate: true,
        webServerConfig: true,
        runStartsAndStopsIt: true,
        baseUrlRelative: true,
        resetNone: true,
        noScopeProse: false,
        noDenominatorProse: false,
        noEmptyRule: false,
      });
    });

    // The seeded-in-error answer moved to the planner, because the planner resolves the package
    // set. The operator cannot resolve that set. It could only have relayed a rule about a value it
    // never sees.
    it('VALID: plannerMarkdown => owns the empty-package-set and zero-unit answers', () => {
      expect({
        seededInError: plannerMarkdown.includes(
          '**An EMPTY set means this item was\n   seeded in error.**',
        ),
        zeroChunkPlan: plannerMarkdown.includes(
          'Write a plan with zero chunks whose `SUMMARY` says exactly that',
        ),
        zeroUnitsSameAnswer: plannerMarkdown.includes('Zero units in scope gets the same answer.'),
        neitherIsAWall: plannerMarkdown.includes(
          'Neither is a wall. Neither\n   is a reason to widen anything.',
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
  // walk covers usually already works. That is why a worker template hard-coding red-first was
  // wrong for four packs out of five.
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
        allBranches: work.includes('Cover ALL branches,\n   success and failure.'),
        happyPathIsTheFailure: work.includes(
          '"I covered the happy path and stopped" is the\n   most common way this role fails.',
        ),
        oneAssertionPerObservable: work.includes('**One assertion per observable**'),
        noToBeVisibleStandIn: work.includes('Never a weaker `toBeVisible()` stand-in.'),
        fullTransition: work.includes('**Assert the full transition**'),
        twoOfAnything: work.includes('**Seed two of anything an assertion must discriminate.**'),
        throughTheUi: work.includes('**Drive state through the UI, not around it.**'),
        preconditionSeedingIsFine: work.includes(
          'You may seed a PRECONDITION through the server or\n   the file system.',
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

    // The reviewer rejects a geometry finding taken from a hidden tab. Both blocks therefore state
    // the same three steps. A criterion whose remedy the worker never got would either reject real
    // findings or never fire.
    it('VALID: ### The work => gives the hidden-tab remedy its reviewer demands', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        bringToFrontFirst: work.includes(
          '**Bring the page to the front before you assert anything about geometry or visibility.**',
        ),
        theHiddenRead: work.includes(
          'A Playwright\npage that is not the active tab reads `document.visibilityState === "hidden"`.',
        ),
        throttledRaf: work.includes(
          'Chromium then\nthrottles `requestAnimationFrame`. It also stops committing layout frames.',
        ),
        looksLikeAProductBug: work.includes('That looks exactly like a product bug'),
        aSecondTabIsHowItHappens: work.includes(
          'A walk that opens a second tab\nor a popup leaves the first page in that state.',
        ),
        threeStepsInOrder: Array.from(work.matchAll(/^\d\. (?:Call|Take|Assert) /gmu)).map(
          (match) => match[0],
        ),
        bringToFront: work.includes('Call `page.bringToFront()`'),
        forceAFrame: work.includes('Take a `page.screenshot()` to force a frame.'),
        assertVisible: work.includes(
          "Assert `await page.evaluate(() => document.visibilityState)` is `'visible'`.",
        ),
        thenMeasure: work.includes('Then measure.'),
        reviewerRejectsWithout: work.includes(
          'Your reviewer rejects a geometry claim that skipped those three.',
        ),
      }).toStrictEqual({
        bringToFrontFirst: true,
        theHiddenRead: true,
        throttledRaf: true,
        looksLikeAProductBug: true,
        aSecondTabIsHowItHappens: true,
        threeStepsInOrder: ['1. Call ', '2. Take ', '3. Assert '],
        bringToFront: true,
        forceAFrame: true,
        assertVisible: true,
        thenMeasure: true,
        reviewerRejectsWithout: true,
      });
    });

    it('VALID: ### The proof => leads on mutation, because the behaviour usually already works', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        watchItFail: proof.includes('**Watch each new case fail before you make it pass.**'),
        mostOfThem: proof.includes('On this discipline that covers most cases.'),
        mutation: proof.includes('Prove the test bites by MUTATION where red-first is impossible.'),
        revertByEditing: proof.includes(
          'Revert BY EDITING the line back, never with `git checkout --`.',
        ),
        readsExactlyAsBefore: proof.includes('Confirm the file reads exactly as it did before.'),
        evidencePerUnit: proof.includes('`EVIDENCE` carries five things per unit:'),
        whatMakesItFail: proof.includes(
          '**what makes it fail** — the specific wrong value or state that turns it red',
        ),
        saysWhichSource: proof.includes(
          'saying whether it came from red-first or from a mutation you reverted',
        ),
        nameTheFailingValue: proof.includes(
          '**Name the failing value for every assertion you list.**',
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
        nameTheFailingValue: true,
      });
    });

    // A config or harness edit here is last-write-wins across sessions the worker cannot see.
    // Sibling items walk their own flows against this same tree.
    it('VALID: workerMarkdown => bans editing the Playwright config or a sibling harness', () => {
      expect({
        ban: workerMarkdown.includes(
          '**Never edit the Playwright config. Never edit a harness a sibling item owns.**',
        ),
        sameTree: workerMarkdown.includes(
          'A sibling item walks\nits own flow against this same tree.',
        ),
        lastWriteWins: workerMarkdown.includes('An edit there is last-write-wins.'),
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

  // The extend-vs-add inventory is the part of this role that matters most. A parallel suite
  // standing beside one that already covered the path is the most expensive mistake available here.
  // A green run hides it.
  describe('plannerMarkdown is inventory-first', () => {
    it('VALID: plannerMarkdown => runs the four inventory steps in order and decides PER UNIT', () => {
      expect({
        inventoryFirst: plannerMarkdown.includes('**Inventory before you author'),
        parallelSuiteIsTheMistake: plannerMarkdown.includes(
          'A parallel suite standing beside one that already covered the path\nis the most expensive mistake this role can make.',
        ),
        steps: Array.from(plannerMarkdown.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        resolveByPackageType: plannerMarkdown.includes(
          '**Resolve the e2e-eligible packages from `packagesAffected` by `packageType`.**',
        ),
        neverAssumeAPath: plannerMarkdown.includes(
          'Never assume a package path from a name you recognised.',
        ),
        listEveryE2e: plannerMarkdown.includes('**List every `.e2e.ts` in those packages.**'),
        openTheSpecs: plannerMarkdown.includes('**OPEN the specs whose `page.goto` target matches'),
        doNotCreditAFile: plannerMarkdown.includes('Do not credit a file by its name.'),
        perUnitNotPerFlow: plannerMarkdown.includes(
          '**Decide extend-vs-add PER UNIT, not per flow.**',
        ),
        threeVerdicts: plannerMarkdown.includes(
          '- **already covered** — name the spec `file:line` and the assertion you read.',
        ),
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

    // A reader copying `{ questId, operationItemId }` sends two undefined values. Every other call
    // site in every pack writes the literal placeholders the brief header names.
    it('VALID: plannerMarkdown => writes the checklist call in the placeholder form, never shorthand', () => {
      expect({
        placeholderForm: plannerMarkdown.includes(
          "`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })`",
        ),
        idsFromTheBriefHeader: plannerMarkdown.includes('with the ids\n   from your brief header'),
        shorthand: plannerMarkdown.includes('get-qa-checklist({ questId, operationItemId })'),
      }).toStrictEqual({
        placeholderForm: true,
        idsFromTheBriefHeader: true,
        shorthand: false,
      });
    });

    // The sign-off gate measures `groundstomper` over every eligible unit on the item's OWN flow
    // (`flowScope: 'declared'`). Never over the units the plan chunked. An "already covered" unit
    // therefore reaches that gate needing a signature. Only the plan can tell the reviewer which
    // spec covers it.
    it('VALID: plannerMarkdown => records an already-covered unit for its reviewer to sign', () => {
      expect({
        stillNeedsASignature: plannerMarkdown.includes(
          '**An "already covered" unit needs no chunk. It still needs a signature.**',
        ),
        idBesideTheSpecLine: plannerMarkdown.includes(
          'Write its id into the\n`SUMMARY` beside the spec `file:line` that covers it.',
        ),
        reviewerSignsOnTheExistingSpec: plannerMarkdown.includes(
          "signs the unit `confirmed` on the existing spec's evidence",
        ),
        gateIsEveryUnitOnTheFlow: plannerMarkdown.includes(
          "Your parent's `done` is measured over EVERY eligible unit on this item's\nflow. Never over the units you cut into chunks.",
        ),
        noChunkStillSigns: plannerMarkdown.includes(
          '**A unit in no chunk is still a unit the reviewer\nmust sign.**',
        ),
        theCostOfLeavingItUnsigned: plannerMarkdown.includes(
          'The next round earns the identical\nrefusal. The round after that spends a pt attempt',
        ),
      }).toStrictEqual({
        stillNeedsASignature: true,
        idBesideTheSpecLine: true,
        reviewerSignsOnTheExistingSpec: true,
        gateIsEveryUnitOnTheFlow: true,
        noChunkStillSigns: true,
        theCostOfLeavingItUnsigned: true,
      });
    });

    // A pack that answers nothing leaves that pointer dangling, because `plannerMinionStatics`
    // tells every planner "your discipline says which kind it wants". This discipline keeps the
    // RECIPE. It throws the probe away. The harness-mining section above already collects that
    // recipe.
    it('VALID: plannerMarkdown => calls its spike diagnostic and pins it under gitignored spike-tmp/', () => {
      expect({
        heading: plannerMarkdown.includes('## Spikes are DIAGNOSTIC on this discipline, not kept'),
        theReasonIsTheRecipe: plannerMarkdown.includes('What survives that probe is the RECIPE.'),
        notAPatternAWorkerExtends: plannerMarkdown.includes(
          'The probe script itself is not a pattern a worker extends',
        ),
        deleteBeforeYouReturn: plannerMarkdown.includes(
          '**Delete every probe you wrote before you return.**',
        ),
        whatItMeasuredGoesInNotes: plannerMarkdown.includes(
          "Write what it measured into the owning chunk's\n`NOTES`.",
        ),
        gitignoredSpikeTmp: plannerMarkdown.includes(
          '**Write every spike under `spike-tmp/`.** That directory is gitignored.',
        ),
        untrackedRefusesTheSignal: plannerMarkdown.includes(
          "An untracked file refuses your parent's signal.",
        ),
        pathNamedInNotes: plannerMarkdown.includes(
          "Name that path in the\nowning chunk's `NOTES` too",
        ),
      }).toStrictEqual({
        heading: true,
        theReasonIsTheRecipe: true,
        notAPatternAWorkerExtends: true,
        deleteBeforeYouReturn: true,
        whatItMeasuredGoesInNotes: true,
        gitignoredSpikeTmp: true,
        untrackedRefusesTheSignal: true,
        pathNamedInNotes: true,
      });
    });

    // This role hits the narrowing case on almost every run, because an e2e-and-harness file set
    // has no Jest counterpart. The pack writes the invocation here. That stops five sessions each
    // guessing it.
    it('VALID: plannerMarkdown => writes the e2e ward invocation and forbids passWithNoTests', () => {
      expect({
        theInvocation: plannerMarkdown.includes(
          "**`WARD` per chunk: `npm run ward -- --only lint,typecheck,e2e -- <the chunk's files>`.**",
        ),
        noJestCounterpart: plannerMarkdown.includes('has no Jest counterpart'),
        everyChunk: plannerMarkdown.includes(
          'This is\nthe invocation that applies on every chunk of this discipline',
        ),
        noPassWithNoTests: plannerMarkdown.includes('**Never reach for `--passWithNoTests`.**'),
        mismatchIsAnAnswer: plannerMarkdown.includes(
          'That is ward answering the question, not failing.',
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
          'A spec that bridges two UIs still lives under the route it starts at.',
        ),
        neverTheSameSpecPath: plannerMarkdown.includes(
          'Two chunks must never name the same spec path',
        ),
        leversNotFixtures: plannerMarkdown.includes(
          '## Mine the existing harnesses for LEVERS, not fixtures',
        ),
        readHarnessesFirst: plannerMarkdown.includes(
          '**Read `packages/*/test/harnesses/**` before you design a fault lever.**',
        ),
        theMeasuredCost: plannerMarkdown.includes('One session lost 2m11s\nrelearning two facts'),
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
          'Asserting a server-side claim through the browser is a\nfalse green.',
        ),
        offMapIsAnotherRole: plannerMarkdown.includes(
          '**Off-map probe families belong to another role, not to you.**',
        ),
        exceptTheFixtureRule: plannerMarkdown.includes('**One rule here was never handed off.**'),
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

  // The judging half is INTERPOLATED. The authoring half is deliberately absent. This pack's worker
  // does not need the modality-choice method. Carrying both put the same 8,281 characters into two
  // prompts at once.
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

    // PAIR: `flowEvidenceContractStatics`' two halves and the four blocks this file authors. The
    // pin above proves the WHOLE judging half is interpolated and the WHOLE authoring half is
    // absent. Neither can see a PARAPHRASE of one of their sections sitting alongside, which is how
    // a copy starts — and the authoring half being absent is exactly the condition under which
    // somebody restates a paragraph of it here instead. The section headings are read off the
    // shared block, so a heading renamed there is a heading renamed here.
    it('VALID: the four blocks => restate none of the shared halves own sections', () => {
      const judgingHeadings = Array.from(
        flowEvidenceContractStatics.judgingMarkdown.matchAll(/^## .+$/gmu),
      ).flatMap((match) => match.slice(0, 1));
      const authoringHeadings = Array.from(
        flowEvidenceContractStatics.authoringMarkdown.matchAll(/^## .+$/gmu),
      ).flatMap((match) => match.slice(0, 1));
      const authored = [operatorMarkdown, plannerMarkdown, workerMarkdown, AUTHORED_REVIEWER];

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
    // Signing one of these never settles one of the sibling's units. Two roles write the SAME field
    // over DISJOINT package kinds.
    it('VALID: reviewerMarkdown => signs flowriderSignoff over the disjoint complement, batched', () => {
      expect({
        sameFieldDisjoint: AUTHORED_REVIEWER.includes(
          'The sibling role writes the\nSAME field over the DISJOINT complement',
        ),
        neverSettlesTheSibling: AUTHORED_REVIEWER.includes(
          'Signing one of yours therefore never settles one of its\nunits.',
        ),
        confirmedBar: AUTHORED_REVIEWER.includes(
          '`confirmed` carries a test `file:line` PLUS what makes that test fail.',
        ),
        unconfirmableBar: AUTHORED_REVIEWER.includes('`unconfirmable` carries what was tried'),
        batch: AUTHORED_REVIEWER.includes('**BATCH the writes.**'),
        noWebServerIsUnconfirmable: AUTHORED_REVIEWER.includes(
          '**A resolved package with no `webServer` declaration blocks every unit it owns.**',
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

    // PAIR: `signoffTrackEligibilityStatics.byTrack` — the data the completion gate itself reads —
    // and this block's claim about what it writes. The FIELD NAME comes off the statics rather than
    // a copy, and so does the split the claim rests on: `groundstomper` and `flowrider` carry the
    // SAME `signoffField` over DISJOINT `packageTypes` (a merged set that loses no member is what
    // disjoint MEANS). Claim the whole field on either side and one reviewer settles units the
    // other measured — here, unit ids nobody ever opened a browser for.
    it('VALID: reviewerMarkdown + signoffTrackEligibilityStatics => write the field this track is assigned, never the sibling half of it', () => {
      const { flowrider, groundstomper, siegemaster } = signoffTrackEligibilityStatics.byTrack;
      const field = groundstomper.signoffField;
      const bothTracksKinds = [...groundstomper.packageTypes, ...flowrider.packageTypes];
      // Deduped rather than compared with `===`. TypeScript narrows both fields to the same literal,
      // so a direct comparison reads as always-true and lint deletes the check.
      const bothTracksFields = [groundstomper.signoffField, flowrider.signoffField];

      expect({
        theSiblingWritesTheSameField: new Set(bothTracksFields).size === 1,
        theTwoTracksShareNoPackageKind: new Set(bothTracksKinds).size === bothTracksKinds.length,
        writesThatField: AUTHORED_REVIEWER.includes(
          `You write \`${field}\` over the browser-reachable package kinds.`,
        ),
        claimsTheWholeField: AUTHORED_REVIEWER.includes(`the whole \`${field}\``),
        claimsTheOtherTracksField: AUTHORED_REVIEWER.includes(siegemaster.signoffField),
      }).toStrictEqual({
        theSiblingWritesTheSameField: true,
        theTwoTracksShareNoPackageKind: true,
        writesThatField: true,
        claimsTheWholeField: false,
        claimsTheOtherTracksField: false,
      });
    });

    // PAIR: `flowEvidenceContractStatics.judgingMarkdown` — interpolated as the spine of this very
    // block — and the words this file authors underneath it. ONE rule, two wordings: a unit nobody
    // can settle after real effort is `unconfirmable`, carrying what was tried AND a `question`,
    // while a unit merely awaiting a test nobody has written is not `unconfirmable` at all and goes
    // to `NEXT: rework` instead. The verdict token and the routing token are READ off the spine, so
    // a reword of either side fails this one test. Diverge and this reviewer either leaves the unit
    // blank — the gate then refuses its parent's `done`, the round spends its pt chain, the quest
    // blocks — or closes an uncovered unit permanently with a verdict nothing proves.
    it('VALID: reviewerMarkdown + judgingMarkdown => carry one rule for an unsettleable unit and another for an uncovered one', () => {
      const { judgingMarkdown } = flowEvidenceContractStatics;
      const verdictOpener = 'after real effort is `';
      const reworkOpener = 'Put it in your `';
      const verdict = judgingMarkdown.slice(
        judgingMarkdown.indexOf(verdictOpener) + verdictOpener.length,
        judgingMarkdown.indexOf('`.** Sign it with'),
      );
      const rework = judgingMarkdown.slice(
        judgingMarkdown.indexOf(reworkOpener) + reworkOpener.length,
        judgingMarkdown.indexOf('` line, where the next round'),
      );

      expect({
        verdict,
        rework,
        spineWantsEvidenceAndAQuestion: judgingMarkdown.includes(
          `**A unit nobody can settle after real effort is \`${verdict}\`.** Sign it with \`evidence\` and a\n\`question\`. Never leave it blank.`,
        ),
        spineKeepsAnUnwrittenTestOut: judgingMarkdown.includes(
          `**A unit that simply needs a test nobody has written yet is NOT \`${verdict}\`.**`,
        ),
        packBarWantsTheAttemptsAndTheQuestion: AUTHORED_REVIEWER.includes(
          `- \`${verdict}\` carries what was tried, why each attempt could not reach it, and a \`question\``,
        ),
        packSignsARealWallThatWay: AUTHORED_REVIEWER.includes(
          `Sign each of those\nunits \`${verdict}\`.`,
        ),
        packNamesBothHalvesOfThatEvidence: AUTHORED_REVIEWER.includes(
          'The missing config is both the evidence and the question.',
        ),
        packRoutesAnUncoveredUnitToRework: AUTHORED_REVIEWER.includes(
          `is \`${rework}\` naming the unit.`,
        ),
        packClosesAnUncoveredUnitWithTheVerdict: AUTHORED_REVIEWER.includes(
          `no chunk covered it either, that\nis \`${verdict}\``,
        ),
      }).toStrictEqual({
        verdict: 'unconfirmable',
        rework: 'NEXT: rework',
        spineWantsEvidenceAndAQuestion: true,
        spineKeepsAnUnwrittenTestOut: true,
        packBarWantsTheAttemptsAndTheQuestion: true,
        packSignsARealWallThatWay: true,
        packNamesBothHalvesOfThatEvidence: true,
        packRoutesAnUncoveredUnitToRework: true,
        packClosesAnUncoveredUnitWithTheVerdict: false,
      });
    });

    // The reviewer template delegates this: "Check the round against your discipline's own
    // checklist, whatever it names." A pack that names no call leaves that pointer dangling. The
    // gate this round is graded by measures every eligible unit on the item's flow.
    it('VALID: reviewerMarkdown => rebuilds the denominator itself and signs every unit in the slice', () => {
      expect({
        rebuildItYourself: AUTHORED_REVIEWER.includes('Rebuild your denominator yourself.'),
        theCall: AUTHORED_REVIEWER.includes(
          "`get-qa-checklist({ questId: 'QUEST_ID', operationItemId: 'OPERATION_ITEM_ID' })` with the ids from\nyour brief header. Your denominator is every unit it returns.",
        ),
        signEveryUnit: AUTHORED_REVIEWER.includes('**Sign EVERY unit in that slice**'),
        includingTheUntouched: AUTHORED_REVIEWER.includes(
          'including the ones this round never touched',
        ),
        gateIsEveryUnitOnTheFlow: AUTHORED_REVIEWER.includes(
          "Your parent's\n`done` is measured over every eligible unit on this item's flow. Never over the units the plan cut\ninto chunks.",
        ),
        alreadyCoveredOnTheExistingSpec: AUTHORED_REVIEWER.includes(
          '**A unit the planner marked "already covered" is signed on the EXISTING spec\'s evidence.**',
        ),
        openThatSpec: AUTHORED_REVIEWER.includes(
          'Open that spec. Read the\nassertion. Sign `confirmed` with that `file:line` and what makes that assertion fail.',
        ),
        notOnThePlansWord: AUTHORED_REVIEWER.includes("Do not sign\nit on the plan's word."),
        neitherSpecNorChunkIsRework: AUTHORED_REVIEWER.includes(
          'Where the plan named no spec for a unit and no chunk covered it either, that\nis `NEXT: rework` naming the unit.',
        ),
      }).toStrictEqual({
        rebuildItYourself: true,
        theCall: true,
        signEveryUnit: true,
        includingTheUntouched: true,
        gateIsEveryUnitOnTheFlow: true,
        alreadyCoveredOnTheExistingSpec: true,
        openThatSpec: true,
        notOnThePlansWord: true,
        neitherSpecNorChunkIsRework: true,
      });
    });

    // A rejection criterion is only honest when the worker was given its remedy. The criterion can
    // be met rather than only failed, because these three steps are the same three the
    // `workerMarkdown` block states.
    it('VALID: reviewerMarkdown => rejects a hidden-tab finding on the remedy its worker was given', () => {
      expect({
        anySpecCanLandHere: AUTHORED_REVIEWER.includes(
          'Any spec that opens a second tab or a popup can land here.',
        ),
        acceptOnlyTheThreeSteps: AUTHORED_REVIEWER.includes(
          "Accept a geometry claim\n  only from a spec that did all three of these before measuring:\n\n  1. called `page.bringToFront()` on the page it measured\n  2. forced a frame with `page.screenshot()`\n  3. asserted `document.visibilityState` is `'visible'`",
        ),
        theWorkerHasThem: AUTHORED_REVIEWER.includes(
          "A spec missing them is `NEXT: rework`, because those three steps are in its worker's\n  instructions.",
        ),
        workerBringsToFront: workerMarkdown.includes('`page.bringToFront()`'),
        workerForcesAFrame: workerMarkdown.includes('`page.screenshot()`'),
        workerAssertsVisibility: workerMarkdown.includes('document.visibilityState'),
      }).toStrictEqual({
        anySpecCanLandHere: true,
        acceptOnlyTheThreeSteps: true,
        theWorkerHasThem: true,
        workerBringsToFront: true,
        workerForcesAFrame: true,
        workerAssertsVisibility: true,
      });
    });

    // PAIR: this pack's `reviewerMarkdown` rejection criterion and its own `workerMarkdown` remedy.
    // Two blocks of one file, served to two different sessions of the same round, which is why
    // nothing else can see them disagree. The criterion's tokens are READ off the reviewer block
    // and looked up in the worker's, so a step reworded on one side alone fails here rather than
    // silently becoming a criterion no worker was ever given. Both blocks also state one mechanism,
    // taken here off the reviewer and matched in the worker with the wrapping normalised away —
    // the wording is the agreement, the line breaks are not. Diverge and the criterion either
    // rejects honest geometry findings or stops firing on the fake ones it exists for.
    it('VALID: reviewerMarkdown + workerMarkdown => accept a geometry claim only on steps the worker was handed', () => {
      const criteria = AUTHORED_REVIEWER.slice(
        AUTHORED_REVIEWER.indexOf('Accept a geometry claim'),
        AUTHORED_REVIEWER.indexOf('A spec missing them'),
      );
      const criteriaTokens = Array.from(criteria.matchAll(/`([^`]+)`/gu)).flatMap((match) =>
        match.slice(1),
      );
      const workerHiddenTab = workerMarkdown.slice(
        workerMarkdown.indexOf('**Bring the page to the front'),
        workerMarkdown.indexOf('### The proof'),
      );
      const mechanism = AUTHORED_REVIEWER.slice(
        AUTHORED_REVIEWER.indexOf('Chromium then throttles'),
        AUTHORED_REVIEWER.indexOf('Nodes read as invisible'),
      )
        .replace(/\s+/gu, ' ')
        .trim();

      expect({
        criteriaTokens,
        tokensTheWorkerWasNeverGiven: criteriaTokens.filter(
          (token) => !workerHiddenTab.includes(token),
        ),
        mechanism,
        theWorkerStatesTheSameMechanism: workerHiddenTab.replace(/\s+/gu, ' ').includes(mechanism),
      }).toStrictEqual({
        criteriaTokens: [
          'page.bringToFront()',
          'page.screenshot()',
          'document.visibilityState',
          "'visible'",
        ],
        tokensTheWorkerWasNeverGiven: [],
        mechanism:
          'Chromium then throttles `requestAnimationFrame`. It also stops committing layout frames.',
        theWorkerStatesTheSameMechanism: true,
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
          '**The intercept ban binds AUTHORED specs.**',
        ),
        impossiblyFastRun: AUTHORED_REVIEWER.includes(
          '**If a green run looks impossibly fast for the work it claims, do not accept it.**',
        ),
        // The reviewer template permits reading a prior run's detail. It bans a second whole-round
        // ward. This sentence has to read as the first, so it does not look like a run this session
        // is forbidden to start.
        readsAPriorRunsDetail: AUTHORED_REVIEWER.includes(
          "Read that run's\nstored detail with `npm run ward -- detail <runId>`",
        ),
        startsNoNewRun: AUTHORED_REVIEWER.includes(
          "That\ncommand reads a PRIOR run's record. It starts no check run of its own.",
        ),
        realPerTestDurations: AUTHORED_REVIEWER.includes('Confirm real per-test\ndurations in it.'),
        discoveredIsNotRan: AUTHORED_REVIEWER.includes(
          'A "discovered" file count is not a count of tests that ran.',
        ),
      }).toStrictEqual({
        wouldPassAgainstBroken: true,
        hiddenTab: true,
        toBeVisibleStandIn: true,
        duplicateWalk: true,
        configEditIsRework: true,
        interceptBanBindsAuthoring: true,
        impossiblyFastRun: true,
        readsAPriorRunsDetail: true,
        startsNoNewRun: true,
        realPerTestDurations: true,
        discoveredIsNotRan: true,
      });
    });

    // PAIR: `reviewerMinionStatics`' ward ban and this pack's proof requirement, which lands inside
    // that template at `$DISCIPLINE`. The template forbids a SECOND round-scoped ward while
    // carving out a run over ONE file or ONE test and a read of a prior run's stored detail. This
    // pack REQUIRES that read on an implausibly fast green. The permitted command is READ out of
    // the template's own carve-out and the round-scoped one out of its step 5, so a reworded
    // template fails here rather than leaving the pack demanding proof its own reviewer is
    // forbidden to gather — which is a session choosing between two instructions in one prompt.
    it('VALID: reviewerMarkdown + reviewerMinionStatics => require only a ward run the reviewer template carves out', () => {
      const { template } = reviewerMinionStatics.prompt;
      const carveOut = template.slice(
        template.indexOf('- **A SECOND round-scoped ward.**'),
        template.indexOf('## What you return'),
      );
      const permitted = Array.from(carveOut.matchAll(/`(npm run ward[^`]*)`/gu)).flatMap((match) =>
        match.slice(1),
      );
      const roundScoped = Array.from(
        new Set(
          Array.from(template.matchAll(/`(npm run ward -- --staged)`/gu)).flatMap((match) =>
            match.slice(1),
          ),
        ),
      );
      const packRuns = Array.from(AUTHORED_REVIEWER.matchAll(/`(npm run ward[^`]*)`/gu)).flatMap(
        (match) => match.slice(1),
      );

      expect({
        permitted,
        roundScoped,
        templateCarvesOutTheNarrowRun: carveOut.includes(
          '**A run over ONE file or ONE test is not on this list.**',
        ),
        templateDefersToTheDiscipline: carveOut.includes(
          'Your discipline above may require one as proof.',
        ),
        packRuns,
        packRunsTheTemplateForbids: packRuns.filter((run) => !permitted.includes(run)),
        packStartsARoundScopedRun: roundScoped.filter((run) => AUTHORED_REVIEWER.includes(run)),
      }).toStrictEqual({
        permitted: ['npm run ward -- detail <runId>'],
        roundScoped: ['npm run ward -- --staged'],
        templateCarvesOutTheNarrowRun: true,
        templateDefersToTheDiscipline: true,
        packRuns: ['npm run ward -- detail <runId>'],
        packRunsTheTemplateForbids: [],
        packStartsARoundScopedRun: [],
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
