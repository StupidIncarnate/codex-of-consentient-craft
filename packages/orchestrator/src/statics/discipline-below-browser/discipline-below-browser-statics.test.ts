import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { disciplineBelowBrowserStatics } from './discipline-below-browser-statics';

const inOrchestrator = (needle: string): boolean =>
  disciplineBelowBrowserStatics.orchestratorMarkdown.includes(needle);

const inPlanner = (needle: string): boolean =>
  disciplineBelowBrowserStatics.plannerMarkdown.includes(needle);

const inWorker = (needle: string): boolean =>
  disciplineBelowBrowserStatics.workerMarkdown.includes(needle);

const inReviewer = (needle: string): boolean =>
  disciplineBelowBrowserStatics.reviewerMarkdown.includes(needle);

describe('disciplineBelowBrowserStatics', () => {
  it('VALID: exported value => has exactly the four discipline blocks as strings', () => {
    expect(disciplineBelowBrowserStatics).toStrictEqual({
      orchestratorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  // A pack block is interpolated INTO a template that owns the placeholders. A block carrying one of
  // its own would either be substituted twice or swallow the operation context.
  it('VALID: every block => carries no $DISCIPLINE or $ARGUMENTS placeholder of its own', () => {
    expect({
      orchestratorDiscipline: inOrchestrator('$DISCIPLINE'),
      orchestratorArguments: inOrchestrator('$ARGUMENTS'),
      plannerDiscipline: inPlanner('$DISCIPLINE'),
      plannerArguments: inPlanner('$ARGUMENTS'),
      workerDiscipline: inWorker('$DISCIPLINE'),
      workerArguments: inWorker('$ARGUMENTS'),
      reviewerDiscipline: inReviewer('$DISCIPLINE'),
      reviewerArguments: inReviewer('$ARGUMENTS'),
    }).toStrictEqual({
      orchestratorDiscipline: false,
      orchestratorArguments: false,
      plannerDiscipline: false,
      plannerArguments: false,
      workerDiscipline: false,
      workerArguments: false,
      reviewerDiscipline: false,
      reviewerArguments: false,
    });
  });

  describe('orchestratorMarkdown', () => {
    // The orchestrator's whole value is that its context stays small enough to run the loop to the
    // end, which is bought by never opening source. A discipline that hands one of these tools back
    // de-gates that silently, so the absence is pinned rather than left to review.
    it('VALID: orchestratorMarkdown => names none of the tools the orchestrator is forbidden', () => {
      expect({
        architecture: inOrchestrator('get-architecture'),
        syntaxRules: inOrchestrator('get-syntax-rules'),
        testingPatterns: inOrchestrator('get-testing-patterns'),
        discoverTool: inOrchestrator('discover'),
        projectMap: inOrchestrator('get-project-map'),
        projectInventory: inOrchestrator('get-project-inventory'),
        folderDetail: inOrchestrator('get-folder-detail'),
      }).toStrictEqual({
        architecture: false,
        syntaxRules: false,
        testingPatterns: false,
        discoverTool: false,
        projectMap: false,
        projectInventory: false,
        folderDetail: false,
      });
    });

    it('VALID: orchestratorMarkdown => stays inside its 2,500 character budget', () => {
      expect(disciplineBelowBrowserStatics.orchestratorMarkdown.length).toBeLessThanOrEqual(2500);
    });

    it('VALID: orchestratorMarkdown => scopes the item to one package slice or the seam', () => {
      expect({
        sliceNotQuest: inOrchestrator('**PACKAGE SLICE, not the whole quest.**'),
        oneItemPerPackage: inOrchestrator(
          'one item per\npackage whose kind it owns, plus ONE seam item for the glue nodes where two of those meet',
        ),
        textSaysWhich: inOrchestrator('a `— package: <name>` or `— seam: <a> + <b>` suffix'),
        contextStatesTheSameSet: inOrchestrator(
          '`packageNames` in your Operation Context state that same set',
        ),
        partitionIsExclusive: inOrchestrator(
          '**A package slice does NOT own the seams, and the seam slice does NOT own the per-package units.**',
        ),
        routesByNode: inOrchestrator('A\nunit routes by its owning NODE'),
        costOfReachingAcross: inOrchestrator(
          'spends your budget on units a sibling item is gated\non while your own denominator stays short of empty',
        ),
      }).toStrictEqual({
        sliceNotQuest: true,
        oneItemPerPackage: true,
        textSaysWhich: true,
        contextStatesTheSameSet: true,
        partitionIsExclusive: true,
        routesByNode: true,
        costOfReachingAcross: true,
      });
    });

    // The single most expensive mistake available to this role: a checklist call missing
    // `packageNames` measures the whole track, so the recomputed gate can never reach empty.
    it('VALID: orchestratorMarkdown => gives the exact denominator call and names the omission cost', () => {
      expect({
        exactCall: inOrchestrator(
          "get-qa-checklist({ questId: 'QUEST_ID', track: 'flowrider', packageNames: [...] })",
        ),
        omitFlowId: inOrchestrator('Omit `flowId`.'),
        verbatimNames: inOrchestrator("Pass your item's names **VERBATIM**."),
        omissionMeasuresWholeTrack: inOrchestrator(
          '**Omit the names and you measure the whole\ntrack, so `remainingItemIds` can never reach empty**',
        ),
        gateRecomputes: inOrchestrator(
          'the completion gate recomputes that\nremainder over YOUR slice',
        ),
        signalBackRefuses: inOrchestrator('`signal-back` refuses `done` while it is non-empty'),
        mostExpensiveMistake: inOrchestrator(
          'That single\nomission is the most expensive mistake available to you',
        ),
      }).toStrictEqual({
        exactCall: true,
        omitFlowId: true,
        verbatimNames: true,
        omissionMeasuresWholeTrack: true,
        gateRecomputes: true,
        signalBackRefuses: true,
        mostExpensiveMistake: true,
      });
    });

    it('VALID: orchestratorMarkdown => counts terminals and branches, drops operational flows', () => {
      expect({
        widerThanObservables: inOrchestrator('`items` is WIDER than the observables.'),
        terminalsAndBranches: inOrchestrator('**Terminals and labelled branches are units too**'),
        happyPathSymptom: inOrchestrator(
          '"I covered the happy path and stopped" shows up here as terminal\nids carrying no signature',
        ),
        operationalNotYours: inOrchestrator('**Operational flows are not yours.**'),
        doNotAddThemBack: inOrchestrator('do not add them back, and never\nsign a unit on one'),
      }).toStrictEqual({
        widerThanObservables: true,
        terminalsAndBranches: true,
        happyPathSymptom: true,
        operationalNotYours: true,
        doNotAddThemBack: true,
      });
    });

    it('VALID: orchestratorMarkdown => treats an empty checklist as a real state, not an error', () => {
      expect({
        realState: inOrchestrator('**An EMPTY checklist is a real state, not an error.**'),
        skipTheRounds: inOrchestrator('skip the rounds, commit that finding, signal `done`'),
        doNotWiden: inOrchestrator('Do NOT widen the call\nto find something to cover.'),
      }).toStrictEqual({
        realState: true,
        skipTheRounds: true,
        doNotWiden: true,
      });
    });

    it('VALID: orchestratorMarkdown => leaves the browser and Playwright to Groundstomper', () => {
      expect({
        neitherIsYours: inOrchestrator('**The browser is not yours and neither is Playwright.**'),
        groundstomperOwnsIt: inOrchestrator('Groundstomper owns the browser walk.'),
        notAHoleInYourSuite: inOrchestrator(
          'is its unit, not a hole in your suite — name it in the handoff and leave it',
        ),
      }).toStrictEqual({
        neitherIsYours: true,
        groundstomperOwnsIt: true,
        notAHoleInYourSuite: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    it('VALID: plannerMarkdown => stays inside its 6,500 character budget', () => {
      expect(disciplineBelowBrowserStatics.plannerMarkdown.length).toBeLessThanOrEqual(6500);
    });

    it('VALID: plannerMarkdown => bundles by worker efficiency and splits what cannot be held', () => {
      expect({
        neverByCount: inPlanner(
          '## Bundle the flows — by what makes a worker efficient, never by count',
        ),
        bundleNotFlow: inPlanner('A piece is a BUNDLE of flows, never one flow apiece.'),
        sharedHarness: inPlanner('**Shared surface or harness**'),
        sharedLayer: inPlanner('**Shared layer**'),
        coupledObservables: inPlanner('**Coupled observables**'),
        provenConsistent: inPlanner(
          'so the pair is proven consistent instead of twice from one side',
        ),
        splitTooBig: inPlanner('**Split anything too big to hold.**'),
        twentyFiveObservables: inPlanner(
          'A bundle much past ~25 observables is one a worker will skim',
        ),
        skimIsInvisible: inPlanner('the skim is invisible in a green run'),
      }).toStrictEqual({
        neverByCount: true,
        bundleNotFlow: true,
        sharedHarness: true,
        sharedLayer: true,
        coupledObservables: true,
        provenConsistent: true,
        splitTooBig: true,
        twentyFiveObservables: true,
        skimIsInvisible: true,
      });
    });

    // Transcribing the observables costs most of a turn and inserts a transcription error between
    // the spec and the test; the plan's value is only what the graph cannot answer.
    it('VALID: plannerMarkdown => refuses to transcribe observables and names what the tool cannot know', () => {
      expect({
        doNotTranscribe: inPlanner('## Do NOT transcribe the observables into the piece briefs'),
        workerCallsItItself: inPlanner(
          "get-qa-checklist({ questId: 'QUEST_ID', flowId: '<id>', track: 'flowrider', packageNames: [...] })",
        ),
        verbatimStraightFromGraph: inPlanner(
          'the **verbatim** `label` and the `checkSurface`, straight from the graph',
        ),
        costOfCopying: inPlanner(
          'costs most of your turn and puts a transcription error between the spec and the test',
        ),
        whyTheyGroup: inPlanner('**why these flows group**'),
        whatAlreadyCovers: inPlanner('**what already covers them**'),
        whichHarnessIsWhose: inPlanner('**which harness is whose** — by FULL PATH'),
        fullPathNeverConcept: inPlanner('name the harness **by FULL PATH, never by concept**'),
        commentSeedingHarness: inPlanner(
          '"the comment-seeding harness" can reach opposite answers about which file that is',
        ),
        authorityRuns: inPlanner("**how far the worker's authority runs**"),
      }).toStrictEqual({
        doNotTranscribe: true,
        workerCallsItItself: true,
        verbatimStraightFromGraph: true,
        costOfCopying: true,
        whyTheyGroup: true,
        whatAlreadyCovers: true,
        whichHarnessIsWhose: true,
        fullPathNeverConcept: true,
        commentSeedingHarness: true,
        authorityRuns: true,
      });
    });

    it('VALID: plannerMarkdown => reads the design decisions and opens the covering test files', () => {
      expect({
        specStageCall: inPlanner("get-quest({ questId: 'QUEST_ID', stage: 'spec' })"),
        decisionVsText: inPlanner(
          "**An observable's text says what to assert; its design decision says what\ngoes wrong if you assert it the easy way.**",
        ),
        easyAssertionStaysGreen: inPlanner(
          'the easy assertion is the one that stays green through the defect',
        ),
        openTheFiles: inPlanner(
          '## Inventory what already covers each flow — BY OPENING THE TEST FILES',
        ),
        doNotCreditAFilename: inPlanner(
          '**Do not credit a filename — this role has shipped a false green by naming three test files in a\ncommit message having opened none of them.**',
        ),
        mirrorMustBeOpened: inPlanner(
          'A `mirror` is a sibling suite or harness you opened, never\na plausible-looking path',
        ),
      }).toStrictEqual({
        specStageCall: true,
        decisionVsText: true,
        easyAssertionStaysGreen: true,
        openTheFiles: true,
        doNotCreditAFilename: true,
        mirrorMustBeOpened: true,
      });
    });
  });

  describe('workerMarkdown', () => {
    it('VALID: workerMarkdown => stays inside its 6,500 character budget', () => {
      expect(disciplineBelowBrowserStatics.workerMarkdown.length).toBeLessThanOrEqual(6500);
    });

    // Imported, never copied: a copy would let the method a worker authors by drift away from the
    // criteria the reviewer rejects by, and neither session could detect that drift.
    it('VALID: workerMarkdown => embeds the shared authoring block and not the judging block', () => {
      expect({
        authoring: inWorker(flowEvidenceContractStatics.authoringMarkdown),
        judging: inWorker(flowEvidenceContractStatics.judgingMarkdown),
      }).toStrictEqual({ authoring: true, judging: false });
    });

    it('VALID: workerMarkdown => takes its scope from the checklist and signs nothing', () => {
      expect({
        scopeFromTool: inWorker('**Your scope comes from a tool, not from prose.**'),
        perFlowCall: inWorker(
          "get-qa-checklist({ questId: 'QUEST_ID', flowId: '<id>', track: 'flowrider', packageNames: [...] })",
        ),
        verbatimLabels: inWorker(
          'Take your assertions from those labels,\nnever from a paraphrase.',
        ),
        pathsTruncated: inWorker('`pathsTruncated: true` means the path list is INCOMPLETE'),
        remainderIsParents: inWorker(
          "`remainingItemIds` is your parent's gate count, not your scope",
        ),
        signsNothing: inWorker('**You sign NOTHING.**'),
        separateReviewer: inWorker('A separate reviewer session writes this track after you'),
        gateWouldBePreSatisfied: inWorker(
          'a signature from the\nsession that wrote the test would satisfy the gate the moment you returned',
        ),
      }).toStrictEqual({
        scopeFromTool: true,
        perFlowCall: true,
        verbatimLabels: true,
        pathsTruncated: true,
        remainderIsParents: true,
        signsNothing: true,
        separateReviewer: true,
        gateWouldBePreSatisfied: true,
      });
    });

    it('VALID: workerMarkdown => outputs Jest against real systems and never Playwright', () => {
      expect({
        jestFileKinds: inWorker(
          'Jest `.test.ts` / `.integration.test.ts` against real routes, real\nqueues, real file systems and real processes',
        ),
        neverMockSubject: inWorker('never a mock of the system under test'),
        noPlaywright: inWorker('**You author\nNO Playwright and you start no server.**'),
        e2eIsGroundstompers: inWorker("A `.e2e.ts` is Groundstomper's output"),
        browserClaimsNotInDenominator: inWorker(
          'the browser side of an `api-call` — is not in\nyour denominator',
        ),
        authorTheLayerUnderneath: inWorker('author the layer underneath it that IS yours'),
        everyTerminalAndBranch: inWorker(
          '**One test per path to EVERY terminal, and every branch taken.**',
        ),
        errorTerminalIsFirstClass: inWorker(
          'An error / 4xx / rejection terminal\nis a first-class path, never optional',
        ),
        fixtureDiscipline: inWorker(
          'at least two of anything an assertion\ndiscriminates, and at least one hostile member per input class',
        ),
        mutationProof: inWorker('prove the test bites by\nMUTATION'),
      }).toStrictEqual({
        jestFileKinds: true,
        neverMockSubject: true,
        noPlaywright: true,
        e2eIsGroundstompers: true,
        browserClaimsNotInDenominator: true,
        authorTheLayerUnderneath: true,
        everyTerminalAndBranch: true,
        errorTerminalIsFirstClass: true,
        fixtureDiscipline: true,
        mutationProof: true,
      });
    });

    it('VALID: workerMarkdown => may close an implementation hole red-first but reports architecture', () => {
      expect({
        section: inWorker('## Closing an implementation hole your own testing exposes'),
        realFinding: inWorker('is a real finding, and closing it\nis usually yours to do'),
        redFirst: inWorker('**Fix it RED-FIRST**'),
        reportEveryChange: inWorker('**Report EVERY such change**'),
        reviewerAdjudicatesFixes: inWorker(
          "Your parent's reviewer adjudicates a fix exactly as it adjudicates a test",
        ),
        closeNotRebuild: inWorker('**Close the hole; do not rebuild the feature.**'),
        architecturalIsReported: inWorker(
          'anything needing a product decision — is REPORTED under\n  `UNFIXABLE`, not taken',
        ),
        neverBend: inWorker('**Never bend the implementation to make a test pass**'),
      }).toStrictEqual({
        section: true,
        realFinding: true,
        redFirst: true,
        reportEveryChange: true,
        reviewerAdjudicatesFixes: true,
        closeNotRebuild: true,
        architecturalIsReported: true,
        neverBend: true,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    // The shared judging block is 5,853 characters on its own, so the AUTHORED delta is what the
    // 6,500 budget can bind here. The block is imported rather than copied, so its size is paid once
    // in the shared statics instead of duplicated into this pack.
    it('VALID: reviewerMarkdown => keeps its authored delta inside the 6,500 character budget', () => {
      const authoredDelta =
        disciplineBelowBrowserStatics.reviewerMarkdown.length -
        flowEvidenceContractStatics.judgingMarkdown.length;

      expect(authoredDelta).toBeLessThanOrEqual(6500);
    });

    it('VALID: reviewerMarkdown => embeds the shared judging block and not the authoring block', () => {
      expect({
        judging: inReviewer(flowEvidenceContractStatics.judgingMarkdown),
        authoring: inReviewer(flowEvidenceContractStatics.authoringMarkdown),
      }).toStrictEqual({ judging: true, authoring: false });
    });

    // The five standards-review concerns belong to a different discipline and are already embedded
    // in the reviewer template; restating them here would be a second, staler rendering.
    it('VALID: reviewerMarkdown => does not restate the standards-review concerns', () => {
      expect({
        craft: inReviewer('craft'),
        perf: inReviewer('perf'),
        dedup: inReviewer('dedup'),
        integrity: inReviewer('integrity'),
        testCases: inReviewer('test-cases'),
      }).toStrictEqual({
        craft: false,
        perf: false,
        dedup: false,
        integrity: false,
        testCases: false,
      });
    });

    // The structural point of the whole pack: the reviewer is a different session from the worker,
    // so "the author never signs its own work" is the pipeline's shape, not an instruction that can
    // be dropped under load — which is exactly what the post-mortem measured happening.
    it('VALID: reviewerMarkdown => is the sole writer of the flowriderSignoff track', () => {
      expect({
        heading: inReviewer('## You are the only writer of the `flowriderSignoff` track'),
        authorIsNotYou: inReviewer(
          'The session that authored these tests is not you, and it signed nothing.',
        ),
        shapeNotInstruction: inReviewer(
          'it is the shape of the pipeline, and it is the only reason your signature\nmeans anything',
        ),
        rebuildsDenominator: inReviewer(
          "get-qa-checklist({ questId: 'QUEST_ID', track: 'flowrider', packageNames: [...] })",
        ),
        patchesIdAndFieldOnly: inReviewer(
          'the id and the\nsign-off field ONLY, because the merge is per-key',
        ),
        playwrightNeverEvidence: inReviewer(
          '**A Playwright `.e2e.ts` is never evidence on this track.**',
        ),
        outsideByPackageKind: inReviewer(
          "which is Groundstomper's unit and outside this denominator by package kind",
        ),
      }).toStrictEqual({
        heading: true,
        authorIsNotYou: true,
        shapeNotInstruction: true,
        rebuildsDenominator: true,
        patchesIdAndFieldOnly: true,
        playwrightNeverEvidence: true,
        outsideByPackageKind: true,
      });
    });

    it('VALID: reviewerMarkdown => batches the sign-off writes and names the per-unit cost', () => {
      expect({
        batch: inReviewer('**BATCH the writes.**'),
        oneCallManySignoffs: inReviewer(
          'ONE `modify-quest` call carrying many sign-offs, never one per unit',
        ),
        fortyFiveCost: inReviewer(
          '45 units\nsigned one at a time is 45 quest writes, 45 outbox appends, 45 WebSocket broadcasts and 45 browser\nrefetches of a file that grows with every one of them',
        ),
      }).toStrictEqual({
        batch: true,
        oneCallManySignoffs: true,
        fortyFiveCost: true,
      });
    });

    // `unconfirmable` closes a unit permanently while sounding responsible, so it is where deferral
    // hides; UNSIGNED is the state that routes the work back, and REMAINDER is how it gets there.
    it('VALID: reviewerMarkdown => routes an unsettleable unit to REMAINDER and audits every unconfirmable', () => {
      expect({
        unsignedGoesToRemainder: inReviewer(
          '**A unit nobody can settle stays UNSIGNED, and it belongs in `REMAINDER`**',
        ),
        neverUnconfirmable: inReviewer('never in an\n`unconfirmable`'),
        unsignedReopens: inReviewer('Unsigned reopens the unit for another authoring pass'),
        unconfirmableClosesForever: inReviewer(
          '`unconfirmable` closes it\nforever while sounding responsible, which is exactly where deferral hides',
        ),
        auditEveryOne: inReviewer("**AUDIT EVERY `unconfirmable`, a predecessor's included.**"),
        assignmentNotWall: inReviewer(
          'Reopen any whose evidence names an\nASSIGNMENT rather than a WALL',
        ),
        routingNotesExamples: inReviewer(
          '"outside my probe paths", "that surface belongs to the sibling\ntrack"',
        ),
        whatYouReopenYouOwn: inReviewer('What you reopen, you own.'),
      }).toStrictEqual({
        unsignedGoesToRemainder: true,
        neverUnconfirmable: true,
        unsignedReopens: true,
        unconfirmableClosesForever: true,
        auditEveryOne: true,
        assignmentNotWall: true,
        routingNotesExamples: true,
        whatYouReopenYouOwn: true,
      });
    });

    it('VALID: reviewerMarkdown => runs Pass A on 100% and names Pass B mandatories plus the sample', () => {
      expect({
        passAStructural: inReviewer('**Pass A — structural, on 100% of claims.**'),
        noExcuseToSample: inReviewer('Cheap and mechanical, so there is no excuse to sample\nit'),
        fiveEvidenceItems: inReviewer(
          'every unit id in scope appears exactly once carrying all five evidence items',
        ),
        passBSemantic: inReviewer('**Pass B — semantic, by opening the file.**'),
        mandatoryNoSampling: inReviewer('MANDATORY, no sampling, for:'),
        layerDisagrees: inReviewer(
          "every claim whose asserted layer disagrees with its unit's `checkSurface`",
        ),
        outermostLayerOnly: inReviewer(
          'every claim proved only at the outermost layer on a flow that reaches deeper',
        ),
        everyFixMade: inReviewer('every fix made'),
        surprising: inReviewer('every claim you simply find surprising'),
        namedSample: inReviewer('**NAMED random sample of the remainder**'),
        silentCap: inReviewer(
          '*A sample you do not\nname is a silent cap, and reads to the next session as "all of this was checked".*',
        ),
      }).toStrictEqual({
        passAStructural: true,
        noExcuseToSample: true,
        fiveEvidenceItems: true,
        passBSemantic: true,
        mandatoryNoSampling: true,
        layerDisagrees: true,
        outermostLayerOnly: true,
        everyFixMade: true,
        surprising: true,
        namedSample: true,
        silentCap: true,
      });
    });

    // The post-mortem's open question: two roles read one rule and reached opposite verdicts on six
    // units. Settled here so neither has to re-derive it.
    it('VALID: reviewerMarkdown => settles the intercept ban as binding authored specs', () => {
      expect({
        heading: inReviewer(
          '## The intercept ban binds AUTHORED specs — and this track is authoring',
        ),
        theDisagreement: inReviewer(
          'Two roles read this rule and reached opposite verdicts on six units, so it is settled here.',
        ),
        suiteMayNotRoute: inReviewer('**A\nsuite must not `page.route` its own backend.**'),
        measurementMayPatch: inReviewer(
          'A hand-driven MEASUREMENT in a live browser MAY\npatch the fetch boundary to force a value, and the resulting sign-off names the lever it pulled.',
        ),
        banBindsYou: inReviewer(
          '**never sign a unit `confirmed` on evidence from an\nintercepted route.**',
        ),
      }).toStrictEqual({
        heading: true,
        theDisagreement: true,
        suiteMayNotRoute: true,
        measurementMayPatch: true,
        banBindsYou: true,
      });
    });
  });
});
