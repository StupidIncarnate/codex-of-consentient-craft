import { disciplineImplementationStatics } from './discipline-implementation-statics';

// The orchestrator block is interpolated into a template that already spends most of its own budget
// on the loop and the tool table; the minion blocks land in templates with more room.
const ORCHESTRATOR_BUDGET_CHARS = 2_500;
const MINION_BUDGET_CHARS = 6_500;

describe('disciplineImplementationStatics', () => {
  it('VALID: exported value => carries exactly the four discipline blocks as strings', () => {
    expect(disciplineImplementationStatics).toStrictEqual({
      orchestratorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  // Each block is substituted AT `$DISCIPLINE`. A block carrying either placeholder itself would be
  // re-substituted, or would swallow the operation context appended at `$ARGUMENTS`.
  it('VALID: every block => carries neither template placeholder', () => {
    const { orchestratorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
      disciplineImplementationStatics;
    const blocks = [orchestratorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown];

    expect({
      discipline: blocks.filter((block) => block.includes('$DISCIPLINE')),
      arguments: blocks.filter((block) => block.includes('$ARGUMENTS')),
    }).toStrictEqual({ discipline: [], arguments: [] });
  });

  describe('budgets — an over-budget pack loses the served prompt its tail, silently', () => {
    it('VALID: orchestratorMarkdown => stays inside the orchestrator budget', () => {
      expect(disciplineImplementationStatics.orchestratorMarkdown.length).toBeLessThanOrEqual(
        ORCHESTRATOR_BUDGET_CHARS,
      );
    });

    it('VALID: minion blocks => the largest stays inside the minion budget', () => {
      const { plannerMarkdown, workerMarkdown, reviewerMarkdown } = disciplineImplementationStatics;

      expect(
        Math.max(plannerMarkdown.length, workerMarkdown.length, reviewerMarkdown.length),
      ).toBeLessThanOrEqual(MINION_BUDGET_CHARS);
    });
  });

  describe('orchestratorMarkdown', () => {
    // The orchestrator template's tool table forbids all seven outright and its own test pins their
    // absence outside its FORBIDDEN block. A pack naming one hands the tool back, and a session that
    // then loads the standards cannot finish the loop — the leak this whole split exists to close.
    it('VALID: orchestratorMarkdown => names no standards or search tool anywhere', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        getArchitecture: orchestratorMarkdown.split('get-architecture').length - 1,
        getSyntaxRules: orchestratorMarkdown.split('get-syntax-rules').length - 1,
        getTestingPatterns: orchestratorMarkdown.split('get-testing-patterns').length - 1,
        discover: orchestratorMarkdown.split('discover').length - 1,
        getProjectMap: orchestratorMarkdown.split('get-project-map').length - 1,
        getProjectInventory: orchestratorMarkdown.split('get-project-inventory').length - 1,
        getFolderDetail: orchestratorMarkdown.split('get-folder-detail').length - 1,
      }).toStrictEqual({
        getArchitecture: 0,
        getSyntaxRules: 0,
        getTestingPatterns: 0,
        discover: 0,
        getProjectMap: 0,
        getProjectInventory: 0,
        getFolderDetail: 0,
      });
    });

    it('VALID: orchestratorMarkdown => defines the item as one cell of the derived partition', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        oneCell: orchestratorMarkdown.includes('Your item is ONE CELL of a partition derived at'),
        perPackagePerFlow: orchestratorMarkdown.includes('one cell per (package, flow)'),
        foundationPerPackage: orchestratorMarkdown.includes(
          'plus one flow-less **foundation** item per\npackage holding its contracts and the individual contract properties whose source resolves under it.',
        ),
        foundationIsNotEmpty: orchestratorMarkdown.includes(
          '**A foundation item is not an item with nothing to do**; it is the thing everything else is built on.',
        ),
      }).toStrictEqual({
        oneCell: true,
        perPackagePerFlow: true,
        foundationPerPackage: true,
        foundationIsNotEmpty: true,
      });
    });

    it('VALID: orchestratorMarkdown => keeps the four-source authority order and its qualifier', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        flowIsNorthStar: orchestratorMarkdown.includes(
          '**the flow graph is the north star** — the USER approved it',
        ),
        observablesAreNotGospel: orchestratorMarkdown.includes(
          '**the observables are the best available expression of that intent, not\ngospel**',
        ),
        writtenBeforeAnyCode: orchestratorMarkdown.includes(
          'written before any code existed, so some WILL be unachievable as written',
        ),
        gitIsTheAuthorityLog: orchestratorMarkdown.includes('**git is the\nauthority log**'),
        ledgerIsDerivedAndExact: orchestratorMarkdown.includes(
          '**the ledger is DERIVED and its scope is\nexact.**',
        ),
        exactIsNotComplete: orchestratorMarkdown.includes(
          '**Exact is not the same as complete. The partition covers everything the spec SAYS; what\nstays approximate is whether the spec says everything.**',
        ),
      }).toStrictEqual({
        flowIsNorthStar: true,
        observablesAreNotGospel: true,
        writtenBeforeAnyCode: true,
        gitIsTheAuthorityLog: true,
        ledgerIsDerivedAndExact: true,
        exactIsNotComplete: true,
      });
    });

    // Gate 3 of the loop says "fetch your denominator; your discipline names the tool". This
    // discipline has no such tool, so it has to say so plainly or the session burns turns hunting
    // for a checklist call it has no track for.
    it('VALID: orchestratorMarkdown => points the denominator at the rendered scope block, not a tool', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        theScopeBlock: orchestratorMarkdown.includes(
          '**Your denominator is the scope block already rendered into your Operation Context**',
        ),
        itsFourParts: orchestratorMarkdown.includes(
          'its nodes,\nverbatim observables, contracts and Seams.',
        ),
        noChecklistTool: orchestratorMarkdown.includes(
          'No checklist tool answers it; do not hunt for one.',
        ),
      }).toStrictEqual({ theScopeBlock: true, itsFourParts: true, noChecklistTool: true });
    });

    it('VALID: orchestratorMarkdown => gives each of the three seam markers a different action', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        alreadyBuiltIsVerifiedAgainstCode: orchestratorMarkdown.includes(
          '**ALREADY BUILT** — verify every observable under it against real COMMITTED CODE, not the ledger',
        ),
        notTheLedgerNotTheSpec: orchestratorMarkdown.includes(
          '(which reports it complete either way) and not the spec (which says what should exist)',
        ),
        shortfallIsARepair: orchestratorMarkdown.includes(
          'shortfall is YOURS to repair, with a `REPAIR:` commit line',
        ),
        notBuiltYetIsShapedAndLeft: orchestratorMarkdown.includes(
          '**NOT BUILT YET** — not yours. Build your half to the shape they need; say what you left.',
        ),
        noSessionOwnsItIsYours: orchestratorMarkdown.includes(
          '**NO SESSION OWNS IT** — nobody downstream builds that half, so it is yours.',
        ),
      }).toStrictEqual({
        alreadyBuiltIsVerifiedAgainstCode: true,
        notTheLedgerNotTheSpec: true,
        shortfallIsARepair: true,
        notBuiltYetIsShapedAndLeft: true,
        noSessionOwnsItIsYours: true,
      });
    });

    it('VALID: orchestratorMarkdown => licenses repair by relevance and forbids unwinding others', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        repairIsExpected: orchestratorMarkdown.includes(
          '**Repair is expected work, not scope creep.**',
        ),
        limitIsRelevance: orchestratorMarkdown.includes(
          'The limit is relevance, not package boundary.',
        ),
        neverRevert: orchestratorMarkdown.includes(
          "**Never delete or revert another session's committed work.**",
        ),
      }).toStrictEqual({ repairIsExpected: true, limitIsRelevance: true, neverRevert: true });
    });

    it('VALID: orchestratorMarkdown => carries additive-only spec authority with both commit markers', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        additiveOnly: orchestratorMarkdown.includes(
          '**You may move the spec, additively only** (`modify-quest`)',
        ),
        adjusted: orchestratorMarkdown.includes(
          '`ADJUSTED:` for an observable\nrestated to what was achievable',
        ),
        couldNotVersusChoseNotTo: orchestratorMarkdown.includes(
          '**"could not" and "chose not to" are different, and only one of them\nis allowed**',
        ),
        added: orchestratorMarkdown.includes(
          '`ADDED:` for an outcome the flow implied that nobody wrote down.',
        ),
      }).toStrictEqual({
        additiveOnly: true,
        adjusted: true,
        couldNotVersusChoseNotTo: true,
        added: true,
      });
    });

    it('VALID: orchestratorMarkdown => makes partial free and a premature done permanent', () => {
      const { orchestratorMarkdown } = disciplineImplementationStatics;

      expect({
        noFailureSignal: orchestratorMarkdown.includes(
          '**There is no failure signal, and `partial` is not the lesser outcome**',
        ),
        chainIsUnbounded: orchestratorMarkdown.includes('this chain is unbounded on\npurpose'),
        doneOverACornerIsInvisible: orchestratorMarkdown.includes(
          '**a `done` over a corner you did not build is invisible to everyone, because the ledger\nwill report that scope complete forever and no later role goes back to fill implementation gaps.**',
        ),
      }).toStrictEqual({
        noFailureSignal: true,
        chainIsUnbounded: true,
        doneOverACornerIsInvisible: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    it('VALID: plannerMarkdown => partitions the cell into dependency-ordered file-groups', () => {
      const { plannerMarkdown } = disciplineImplementationStatics;

      expect({
        oneFileGroupPerPiece: plannerMarkdown.includes('One **file-group** per piece'),
        laterWiresIntoRealFiles: plannerMarkdown.includes(
          "ordered by dependency so a later worker wires into an earlier one's\nREAL on-disk files instead of a shape it imagined",
        ),
        filesAreOwnership: plannerMarkdown.includes(
          '`files` is OWNERSHIP. Two pieces must never list the same path',
        ),
        foundationCellIsNotEmpty: plannerMarkdown.includes(
          'the thing every other cell builds on, never an empty one',
        ),
      }).toStrictEqual({
        oneFileGroupPerPiece: true,
        laterWiresIntoRealFiles: true,
        filesAreOwnership: true,
        foundationCellIsNotEmpty: true,
      });
    });

    it('VALID: plannerMarkdown => makes each piece carry the six things a worker cannot derive', () => {
      const { plannerMarkdown } = disciplineImplementationStatics;

      expect({
        flowAndPlacement: plannerMarkdown.includes('**the flow, and where the piece sits in it**'),
        observablesVerbatim: plannerMarkdown.includes(
          '**the observables it must satisfy, quoted VERBATIM**',
        ),
        contracts: plannerMarkdown.includes('**the contracts it takes and returns**'),
        designDecisions: plannerMarkdown.includes('**the design decisions that constrain it**'),
        mirror: plannerMarkdown.includes(
          '**a MIRROR** — an existing sibling of the same folder type',
        ),
        wiresInto: plannerMarkdown.includes('**the already-built exports it wires into**'),
        theReason: plannerMarkdown.includes(
          '**A minion that understands the flow writes assertions that mean something; one that only got a file\npath writes a test that passes and proves nothing.**',
        ),
      }).toStrictEqual({
        flowAndPlacement: true,
        observablesVerbatim: true,
        contracts: true,
        designDecisions: true,
        mirror: true,
        wiresInto: true,
        theReason: true,
      });
    });

    it('VALID: plannerMarkdown => keeps a spike on disk instead of throwing it away', () => {
      const { plannerMarkdown } = disciplineImplementationStatics;

      expect({
        heading: /^## Spikes are KEPT$/mu.test(plannerMarkdown),
        firstPassNotAProbe: plannerMarkdown.includes(
          'it is **KEPT** — a first pass, not\na throwaway probe',
        ),
        namedForTheNextRound: plannerMarkdown.includes(
          "name it in the owning piece's `notes`, so the next round\nenhances a working pattern instead of re-deriving it from nothing",
        ),
      }).toStrictEqual({ heading: true, firstPassNotAProbe: true, namedForTheNextRound: true });
    });

    it('VALID: plannerMarkdown => carries the observable-cannot-be-met section intact', () => {
      const { plannerMarkdown } = disciplineImplementationStatics;

      expect({
        heading: /^## When an observable cannot be met as written$/mu.test(plannerMarkdown),
        genuineEffort: plannerMarkdown.includes(
          '**The bar is genuine effort, not first resistance.**',
        ),
        neverSilentlyDrop: plannerMarkdown.includes('**Never silently drop it.**'),
        nearestAchievable: plannerMarkdown.includes(
          '**Deliver the NEAREST achievable outcome that still serves the flow.**',
        ),
        minimumDistance: plannerMarkdown.includes(
          'Retreat the\n   minimum distance, never to something trivially true.',
        ),
        adjustedMarker: plannerMarkdown.includes('carries the `ADJUSTED:` line'),
        deletesAreRefused: plannerMarkdown.includes(
          'You may never delete an observable, a node or an edge, or replace a flow.',
        ),
      }).toStrictEqual({
        heading: true,
        genuineEffort: true,
        neverSilentlyDrop: true,
        nearestAchievable: true,
        minimumDistance: true,
        adjustedMarker: true,
        deletesAreRefused: true,
      });
    });

    it('VALID: plannerMarkdown => carries the flow-implies-an-outcome section intact', () => {
      const { plannerMarkdown } = disciplineImplementationStatics;

      expect({
        heading: /^## When the flow implies an outcome nobody wrote down$/mu.test(plannerMarkdown),
        addThemFreely: plannerMarkdown.includes('**Add them, freely.** This is the safe direction'),
        constraintOnYourself: plannerMarkdown.includes(
          '**an observable you add is a constraint on\nYOURSELF**',
        ),
        cannotSlipPastAGate: plannerMarkdown.includes(
          'it can never be a way to slip past a gate — only a\nway to make the target more honest',
        ),
        vagueIsWorseThanNone: plannerMarkdown.includes(
          'a vague addition is worse than none,\nbecause it looks like coverage',
        ),
        addedMarker: plannerMarkdown.includes('flag it so the commit carries the\n`ADDED:` line'),
      }).toStrictEqual({
        heading: true,
        addThemFreely: true,
        constraintOnYourself: true,
        cannotSlipPastAGate: true,
        vagueIsWorseThanNone: true,
        addedMarker: true,
      });
    });
  });

  describe('workerMarkdown', () => {
    it('VALID: workerMarkdown => loads all three standards sources before it reads any code', () => {
      const { workerMarkdown } = disciplineImplementationStatics;
      const standardsTools = ['`get-architecture`', '`get-syntax-rules`', '`get-testing-patterns`'];

      expect({
        standardsBlocking: workerMarkdown.includes('**Standards first, BLOCKING.**'),
        namesAllThree: standardsTools.filter((tool) => workerMarkdown.includes(tool)),
        beforeTheMirror: workerMarkdown.includes(
          'before you read the mirror, run\n   `discover`, or open any code',
        ),
      }).toStrictEqual({
        standardsBlocking: true,
        namesAllThree: standardsTools,
        beforeTheMirror: true,
      });
    });

    it('VALID: workerMarkdown => runs the TDD method with the observables driving the first test', () => {
      const { workerMarkdown } = disciplineImplementationStatics;

      expect({
        flowContextBeforeCode: /^## Read the brief's flow context BEFORE the code$/mu.test(
          workerMarkdown,
        ),
        pathAndSignatureProvesNothing: workerMarkdown.includes(
          'A test written from a path and a signature will pass and prove\nnothing',
        ),
        failingTestFirst: workerMarkdown.includes(
          '**Write the failing test FIRST, driven by the observables.**',
        ),
        implementUntilGreen: workerMarkdown.includes('**Implement until green**'),
        scopedWard: workerMarkdown.includes('**Scoped ward, then your own diff.**'),
      }).toStrictEqual({
        flowContextBeforeCode: true,
        pathAndSignatureProvesNothing: true,
        failingTestFirst: true,
        implementUntilGreen: true,
        scopedWard: true,
      });
    });

    it('VALID: workerMarkdown => distinguishes a behavioural red from a structural one', () => {
      const { workerMarkdown } = disciplineImplementationStatics;

      expect({
        theRule: workerMarkdown.includes('**Watch it fail BEHAVIOURALLY, not STRUCTURALLY.**'),
        structuralRedProvesNothing: workerMarkdown.includes(
          'A red that is an import error, a missing export or a\n   type error proves nothing about your assertion',
        ),
        theRedYouNeed: workerMarkdown.includes(
          'The\n   red you need is a WRONG VALUE: the assertion ran, reached the shelled code, and disagreed with it.',
        ),
        noRedMeansTheAssertionIsWrong: workerMarkdown.includes(
          'If you cannot produce that red, the assertion is not testing what you think it is',
        ),
      }).toStrictEqual({
        theRule: true,
        structuralRedProvesNothing: true,
        theRedYouNeed: true,
        noRedMeansTheAssertionIsWrong: true,
      });
    });

    it('VALID: workerMarkdown => routes test ownership through the folder type, e2e excluded', () => {
      const { workerMarkdown } = disciplineImplementationStatics;

      expect({
        folderTypeDecides: workerMarkdown.includes(
          '**You test what you build, at the level the FOLDER TYPE demands.** Follow the folder type, not a rule\nof thumb',
        ),
        integrationInsteadOfUnit: workerMarkdown.includes(
          '**`flows/` and `startup/` require an `.integration.test.ts` INSTEAD of a unit test.**',
        ),
        colocationLintFails: workerMarkdown.includes(
          '`enforce-implementation-colocation` fails the lint when the right companion\n  is missing',
        ),
        ownsFlowsAndStartupWiring: workerMarkdown.includes(
          '**You own the `flows/` and `startup/` wiring itself.**',
        ),
        playwrightIsNotYours: workerMarkdown.includes(
          '**The one boundary: Playwright `.e2e.ts` is NOT yours.**',
        ),
        neverAuthorE2e: workerMarkdown.includes('Never author an `.e2e.ts`.'),
      }).toStrictEqual({
        folderTypeDecides: true,
        integrationInsteadOfUnit: true,
        colocationLintFails: true,
        ownsFlowsAndStartupWiring: true,
        playwrightIsNotYours: true,
        neverAuthorE2e: true,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    it('VALID: reviewerMarkdown => verifies the round against the plan on four axes', () => {
      const { reviewerMarkdown } = disciplineImplementationStatics;

      expect({
        intent: reviewerMarkdown.includes(
          "**Intent.** Does the implementation make that piece's `intent` TRUE",
        ),
        genuineTests: reviewerMarkdown.includes(
          '**Genuine tests.** Does every behaviour the piece added have an assertion that would go red without\n  it?',
        ),
        rightExports: reviewerMarkdown.includes(
          "**The RIGHT exports.** Does each dependent piece call its predecessor's REAL export",
        ),
        stayedInScope: reviewerMarkdown.includes(
          '**Scope.** Did the worker stay inside its `files`?',
        ),
      }).toStrictEqual({
        intent: true,
        genuineTests: true,
        rightExports: true,
        stayedInScope: true,
      });
    });

    // Post-mortem section 5.10: the worker's return has no field for "I witnessed a red", so nothing
    // in the loop can notice its absence. Every minion on the audited quest skipped the step.
    it('VALID: reviewerMarkdown => treats the TDD red step as skipped and replaces it with a visible check', () => {
      const { reviewerMarkdown } = disciplineImplementationStatics;

      expect({
        heading: /^## The red step is structurally invisible — assume it was skipped$/mu.test(
          reviewerMarkdown,
        ),
        returnSaysNothingAboutTheRed: reviewerMarkdown.includes(
          "A worker's return reports `WARD: green | red` and says NOTHING about whether a red was ever\nwitnessed.",
        ),
        everyMinionSkippedIt: reviewerMarkdown.includes(
          'on the audited\nquest EVERY minion skipped it, which is how two tautological tests shipped green',
        ),
        whatValueWouldMakeItFail: reviewerMarkdown.includes(
          '**read the assertion and ask what value would\nmake it fail.**',
        ),
        noSuchValueMeansNoProof: reviewerMarkdown.includes(
          'the test proves nothing, regardless of what\nthe worker claimed',
        ),
      }).toStrictEqual({
        heading: true,
        returnSaysNothingAboutTheRed: true,
        everyMinionSkippedIt: true,
        whatValueWouldMakeItFail: true,
        noSuchValueMeansNoProof: true,
      });
    });

    it('VALID: reviewerMarkdown => names all four defects the open-the-files check caught', () => {
      const { reviewerMarkdown } = disciplineImplementationStatics;
      const defects = [
        '**A stub that swallowed the subject.**',
        '**A measurement that measured nothing.**',
        '**A tautological assertion.**',
        '**A proxy that mocked application code.**',
      ];

      expect({
        allFourNamed: defects.filter((defect) => reviewerMarkdown.includes(defect)),
        outerParseNeverRan: reviewerMarkdown.includes(
          'Invalid-case tests routed through a stub, so the outer\n  `parse` never executed',
        ),
        countedFramesMeasuredNoSpacing: reviewerMarkdown.includes(
          'A cadence test that counted frames but measured no\n  spacing',
        ),
        theTautologyVerbatim: reviewerMarkdown.includes(
          "`expect(x.getAttribute('data-testid')).toBe('HEALTH_PAGE')`",
        ),
        proxyMockedAppCodeForAFalseBranch: reviewerMarkdown.includes(
          'A responder proxy mocking application code to reach a\n  false branch',
        ),
        allReturnedGreen: reviewerMarkdown.includes(
          'Every one of them returned a green ward and a confident summary.',
        ),
      }).toStrictEqual({
        allFourNamed: defects,
        outerParseNeverRan: true,
        countedFramesMeasuredNoSpacing: true,
        theTautologyVerbatim: true,
        proxyMockedAppCodeForAFalseBranch: true,
        allReturnedGreen: true,
      });
    });

    it('VALID: reviewerMarkdown => carries the implementation-specific checks and no sign-off track', () => {
      const { reviewerMarkdown } = disciplineImplementationStatics;

      expect({
        companionsFollowFolderType: reviewerMarkdown.includes(
          '**Companions follow the FOLDER TYPE.**',
        ),
        noPlaywright: reviewerMarkdown.includes('**No Playwright.**'),
        specMovementIsDeclared: reviewerMarkdown.includes(
          '**Spec movement is declared, or it did not happen.**',
        ),
        crossPackageRepairIsDeclared: reviewerMarkdown.includes(
          '**Cross-package repair is declared.**',
        ),
        writesNoSignoffs: reviewerMarkdown.includes(
          '**This discipline writes NONE.** Implementation has no sign-off track and no disposition ledger',
        ),
        reportsTheEmptyField: reviewerMarkdown.includes(
          'Report `SIGNOFFS WRITTEN: none — implementation writes no track`',
        ),
      }).toStrictEqual({
        companionsFollowFolderType: true,
        noPlaywright: true,
        specMovementIsDeclared: true,
        crossPackageRepairIsDeclared: true,
        writesNoSignoffs: true,
        reportsTheEmptyField: true,
      });
    });

    // The five standards-review concerns live in a shared statics the reviewer template embeds and
    // apply to every discipline. A copy here would be a second, staler rendering of them.
    it('VALID: reviewerMarkdown => restates none of the shared standards-review concerns', () => {
      const { reviewerMarkdown } = disciplineImplementationStatics;
      const concerns = ['craft', 'perf', 'dedup', 'integrity', 'test-cases'];

      expect(concerns.filter((concern) => reviewerMarkdown.includes(concern))).toStrictEqual([]);
    });

    // The pack may narrow what the reviewer looks at; it may never rename the fields the orchestrator
    // routes on, because the orchestrator cannot read code to work out what a renamed field meant.
    it('VALID: reviewerMarkdown => refers to the template return fields by their own names', () => {
      const { reviewerMarkdown } = disciplineImplementationStatics;
      const fields = ['REMAINDER', 'UNFIXABLE', 'SIGNOFFS WRITTEN', 'WARD'];

      expect(fields.filter((field) => reviewerMarkdown.includes(field))).toStrictEqual(fields);
    });
  });
});
