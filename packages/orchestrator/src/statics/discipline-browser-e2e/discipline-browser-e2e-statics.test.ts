import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { standardsReviewConcernsStatics } from '../standards-review-concerns/standards-review-concerns-statics';
import { disciplineBrowserE2eStatics } from './discipline-browser-e2e-statics';

const inOrchestrator = (needle: string): boolean =>
  disciplineBrowserE2eStatics.orchestratorMarkdown.includes(needle);

const inPlanner = (needle: string): boolean =>
  disciplineBrowserE2eStatics.plannerMarkdown.includes(needle);

const inWorker = (needle: string): boolean =>
  disciplineBrowserE2eStatics.workerMarkdown.includes(needle);

const inReviewer = (needle: string): boolean =>
  disciplineBrowserE2eStatics.reviewerMarkdown.includes(needle);

describe('disciplineBrowserE2eStatics', () => {
  it('VALID: exported value => carries exactly the four discipline blocks as non-empty strings', () => {
    expect(disciplineBrowserE2eStatics).toStrictEqual({
      orchestratorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  // The blocks are interpolated INTO templates that own the placeholders. A pack carrying one of its
  // own would either swallow the template's substitution or leave an unsubstituted token in a prompt.
  it('VALID: every block => carries no template placeholder of its own', () => {
    const placeholders = ['$DISCIPLINE', '$ARGUMENTS'];

    expect({
      orchestrator: placeholders.filter((token) => inOrchestrator(token)),
      planner: placeholders.filter((token) => inPlanner(token)),
      worker: placeholders.filter((token) => inWorker(token)),
      reviewer: placeholders.filter((token) => inReviewer(token)),
    }).toStrictEqual({
      orchestrator: [],
      planner: [],
      worker: [],
      reviewer: [],
    });
  });

  // The orchestrator template's whole design is a session whose context CANNOT fill up, because it
  // never opens source. A discipline that hands one of these tools back de-gates that budget, and the
  // minions load them anyway. `DISCOVERY MISMATCH` is deliberately the uppercased ward output, which
  // is not the tool name.
  it('VALID: orchestratorMarkdown => names none of the repo-exploration or standards tools', () => {
    const forbidden = [
      'get-architecture',
      'get-syntax-rules',
      'get-testing-patterns',
      'discover',
      'get-project-map',
      'get-project-inventory',
      'get-folder-detail',
    ];

    expect(forbidden.filter((tool) => inOrchestrator(tool))).toStrictEqual([]);
  });

  // 2,500 for the orchestrator (it runs the whole loop on one context) and 6,500 for each minion
  // block. `reviewerMarkdown` is measured over the prose authored HERE: the interpolated evidence
  // contract is governed by its own colocated test, and counting it twice would price a shared block
  // as a pack cost.
  it('VALID: every block => stays inside its authored-character budget', () => {
    const reviewerAuthored = disciplineBrowserE2eStatics.reviewerMarkdown.replace(
      flowEvidenceContractStatics.judgingMarkdown,
      '',
    );

    expect({
      orchestrator: disciplineBrowserE2eStatics.orchestratorMarkdown.length <= 2500,
      planner: disciplineBrowserE2eStatics.plannerMarkdown.length <= 6500,
      worker: disciplineBrowserE2eStatics.workerMarkdown.length <= 6500,
      reviewerAuthored: reviewerAuthored.length <= 6500,
    }).toStrictEqual({
      orchestrator: true,
      planner: true,
      worker: true,
      reviewerAuthored: true,
    });
  });

  describe('orchestratorMarkdown', () => {
    // Naming the sibling track returns the exact complement of this role's work, so its
    // `remainingItemIds` clears at zero while the completion gate refuses `done` — a stall with no
    // visible cause unless the consequence is written down.
    it('VALID: block => keys the denominator on the ROLE name and names the sibling-track cost', () => {
      expect({
        oneFlowsWalk: inOrchestrator("**ONE runtime flow's browser walk**"),
        playwrightOnly: inOrchestrator('output is Playwright and only Playwright'),
        call: inOrchestrator("`get-qa-checklist({ questId, flowId, track: 'groundstomper' })`"),
        trackIsTheRole: inOrchestrator('**The track name is your ROLE.**'),
        siblingReturnsComplement: inOrchestrator('the exact complement of\nyour work'),
        clearsAtZero: inOrchestrator(
          'would clear at zero while your own completion gate refuses\n`done`',
        ),
      }).toStrictEqual({
        oneFlowsWalk: true,
        playwrightOnly: true,
        call: true,
        trackIsTheRole: true,
        siblingReturnsComplement: true,
        clearsAtZero: true,
      });
    });

    // Resolving by KIND is what lets the role run in a repo with several UI packages or none, and the
    // empty case is a seeding error rather than work — a session that treats it as work invents specs.
    it('EMPTY: block => resolves the package set by kind and signals done on an empty set', () => {
      expect({
        byPackageType: inOrchestrator(
          'resolved from `packagesAffected` by `packageType` (the browser-reachable kinds)',
        ),
        neverByName: inOrchestrator('**never from a\npackage name you recognised**'),
        isASet: inOrchestrator('a repo may have several UI packages, and it may\nhave none'),
        seededInError: inOrchestrator(
          '**If the set is empty this item was seeded in error — say so plainly and signal `done`.**',
        ),
      }).toStrictEqual({
        byPackageType: true,
        neverByName: true,
        isASet: true,
        seededInError: true,
      });
    });

    it('VALID: block => leaves the sub-browser layers to Flowrider rather than asserting them', () => {
      expect({
        notTheWholeSuite: inOrchestrator('**You are not the whole test suite for this flow.**'),
        flowriderRunsAhead: inOrchestrator(
          'Flowrider owns every layer below the browser and\nruns ahead of you',
        ),
        sayAndLeave: inOrchestrator('Where the flow goes deeper, say so and leave it'),
        falseGreen: inOrchestrator(
          'asserting a server-side claim\nthrough the browser is a false green',
        ),
      }).toStrictEqual({
        notTheWholeSuite: true,
        flowriderRunsAhead: true,
        sayAndLeave: true,
        falseGreen: true,
      });
    });

    // The config is install-time scaffolding every sibling item on the quest shares, so an edit there
    // is last-write-wins across sessions that never see each other. The missing-webServer case has a
    // sign-off answer precisely so it is not answered with an edit.
    it('VALID: block => never stands a dev server up and never edits the Playwright config', () => {
      expect({
        noDevServer: inOrchestrator('**You never touch a dev server and are not given one.**'),
        webServerOwnsIt: inOrchestrator(
          "the project's Playwright `webServer` config, brought up for the run and torn down with it",
        ),
        baseUrlRelative: inOrchestrator(
          'navigate `baseURL`-relative so no URL ever reaches a test',
        ),
        neverEditConfig: inOrchestrator('**Never edit the Playwright\nconfig**'),
        sharedTree: inOrchestrator('sibling items work\nagainst this same tree'),
        missingWebServer: inOrchestrator(
          'If a resolved package declares no `webServer`, every unit it blocks is\nsigned `unconfirmable`',
        ),
      }).toStrictEqual({
        noDevServer: true,
        webServerOwnsIt: true,
        baseUrlRelative: true,
        neverEditConfig: true,
        sharedTree: true,
        missingWebServer: true,
      });
    });

    // The off-map families are a hand-off; the fixture rule underneath one of them never was, so the
    // exception has to be stated with the hand-off or it reads as fully delegated.
    it('VALID: block => hands off the off-map families but keeps the benign-input hole', () => {
      expect({
        siegemastersCharter: inOrchestrator(
          "hostile-input, perf and their siblings — are Siegemaster's charter",
        ),
        outsideDenominator: inOrchestrator('sit\noutside your denominator'),
        neverWasAHandoff: inOrchestrator('**with one exception that never was a hand-off'),
        ownFixtureRule: inOrchestrator(
          'seeding only well-behaved\nvalues is your own fixture rule',
        ),
        holeOnYourSide: inOrchestrator(
          'a benign-input monoculture in these specs is a hole on YOUR\nside',
        ),
      }).toStrictEqual({
        siegemastersCharter: true,
        outsideDenominator: true,
        neverWasAHandoff: true,
        ownFixtureRule: true,
        holeOnYourSide: true,
      });
    });

    // An e2e-and-harness file set has no Jest counterpart, so the mismatch is the NORMAL outcome here
    // rather than an exception — a session reading it as a break widens scope or reaches for a flag.
    it('VALID: block => reads DISCOVERY MISMATCH as a narrowing, never as a break', () => {
      expect({
        expectItEveryRun: inOrchestrator(
          '**You will hit the ward narrowing case almost every run**',
        ),
        noJestCounterpart: inOrchestrator('an e2e-and-harness file set has\nno Jest counterpart'),
        meaningOfTheRed: inOrchestrator(
          'a red meaning "this check had nothing to\ndo here", not "your code is broken"',
        ),
        theChecks: inOrchestrator('(`--only lint,typecheck,e2e -- <files>`)'),
        sayWhichInCommit: inOrchestrator('say in the commit which you ran and why'),
        noPassWithNoTests: inOrchestrator('**Never reach\nfor `--passWithNoTests`.**'),
      }).toStrictEqual({
        expectItEveryRun: true,
        noJestCounterpart: true,
        meaningOfTheRed: true,
        theChecks: true,
        sayWhichInCommit: true,
        noPassWithNoTests: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    // A duplicate suite is invisible in a green run, which is why the inventory is ordered and
    // blocking rather than advisory. Step 3 is the one that gets skipped: reading a filename is
    // cheaper than opening the spec, and it is wrong often enough to have its own sentence.
    it('VALID: block => orders the inventory and opens specs rather than reading their names', () => {
      expect({
        mostExpensiveMistake: inPlanner(
          '**Inventory before you author — a parallel suite standing beside one that already covered the path\nis the most expensive mistake this role can make, and it is invisible in a green run.**',
        ),
        resolveByType: inPlanner(
          '**Resolve the e2e-eligible packages from `packagesAffected` by `packageType`**',
        ),
        listEveryE2e: inPlanner("`discover({ glob: '<e2e-package>/src/**/*.e2e.ts' })`"),
        wholeExistingSurface: inPlanner('is the whole existing surface you might be extending'),
        openTheSpecs: inPlanner(
          "**OPEN the specs whose `page.goto` target matches this flow's entry node, and open the harnesses\n   they import.**",
        ),
        neverCreditByName: inPlanner(
          '*Do not credit a file by its name — a filename that sounds like your flow routinely\n   asserts something else entirely.*',
        ),
      }).toStrictEqual({
        mostExpensiveMistake: true,
        resolveByType: true,
        listEveryE2e: true,
        wholeExistingSurface: true,
        openTheSpecs: true,
        neverCreditByName: true,
      });
    });

    // Per-flow verdicts are how both failure modes ship: a duplicate suite and a case bolted into an
    // unrelated spec. Both wrong answers are named because "decide per unit" alone reads as advice.
    it('VALID: block => decides extend-vs-add per UNIT with three named verdicts', () => {
      expect({
        perUnit: inPlanner('**Decide extend-vs-add PER UNIT, not per flow.**'),
        alreadyCovered: inPlanner(
          '**already covered** (naming the spec `file:line` and the assertion you read)',
        ),
        extend: inPlanner('**extend** (naming the spec file the case goes into)'),
        add: inPlanner(
          '**add** (naming the new file and why no\n   existing spec is the right home)',
        ),
        wrongAdd: inPlanner(
          '*A whole flow marked "add" while three specs already walk its\n   entry route is a wrong answer',
        ),
        wrongExtend: inPlanner(
          'so is a whole flow marked "extend" into a spec that asserts\n   something unrelated.*',
        ),
        unitIdsAreGradeable: inPlanner(
          "piece's `unitIds` are the terminal, branch and observable ids that one spec must cover",
        ),
      }).toStrictEqual({
        perUnit: true,
        alreadyCovered: true,
        extend: true,
        add: true,
        wrongAdd: true,
        wrongExtend: true,
        unitIdsAreGradeable: true,
      });
    });

    it('VALID: block => colocates each spec at the route folder its walk starts in', () => {
      expect({
        path: inPlanner('`<e2e-package>/src/flows/<route>/<feature>.e2e.ts`'),
        routeIsTheGoto: inPlanner(
          'where `<route>` is the route folder the test STARTS at (its `page.goto` target)',
        ),
        packageWasResolved: inPlanner(
          '`<e2e-package>` is a package you RESOLVED, never a path you assumed',
        ),
        bridgingCase: inPlanner(
          'Where the test starts is where\nit lives, even when it bridges two UIs.',
        ),
        oneFilePerPiece: inPlanner("One piece is one `.e2e.ts` file's worth of walk"),
      }).toStrictEqual({
        path: true,
        routeIsTheGoto: true,
        packageWasResolved: true,
        bridgingCase: true,
        oneFilePerPiece: true,
      });
    });

    // A prior role has usually already paid for the fault levers, and the measured cost of not
    // looking is a concrete rediscovery — kept concrete so the instruction is not read as generic
    // reuse advice.
    it('VALID: block => mines existing harnesses for levers with the measured rediscovery cost', () => {
      expect({
        leversNotFixtures: inPlanner('## Mine the existing harnesses for LEVERS, not fixtures'),
        readThemFirst: inPlanner(
          '**Read `packages/*/test/harnesses/**` before you design a fault lever**',
        ),
        nameItInNotes: inPlanner("name the\nlever you found in the owning piece's `notes`"),
        measuredCost: inPlanner('one session lost\n2m11s'),
        offlineLesson: inPlanner(
          '`context.setOffline(true)` does NOT close an established WebSocket in\nChromium',
        ),
        hmrLesson: inPlanner("closing Vite's HMR socket reloads the document"),
      }).toStrictEqual({
        leversNotFixtures: true,
        readThemFirst: true,
        nameItInNotes: true,
        measuredCost: true,
        offlineLesson: true,
        hmrLesson: true,
      });
    });
  });

  describe('workerMarkdown', () => {
    // Terminals with no signature are the only visible trace of a happy-path-only walk, and they
    // surface at the reviewer rather than in the run, so the branch mandate carries its failure mode.
    it('VALID: block => walks every terminal and every branch, failures included', () => {
      expect({
        onePerPath: inWorker('**One test per path**'),
        everyTerminal: inWorker('to EVERY terminal your piece owns'),
        allBranches: inWorker('cover ALL branches, success and failure'),
        failuresAreFirstClass: inWorker(
          'An error toast, a 4xx rendering, a\n  rejection terminal is first-class, never optional',
        ),
        namedFailureMode: inWorker(
          '*"I covered the happy path and stopped" is the\n  most common way this role fails, and it shows up only as terminal ids with no signature.*',
        ),
      }).toStrictEqual({
        onePerPath: true,
        everyTerminal: true,
        allBranches: true,
        failuresAreFirstClass: true,
        namedFailureMode: true,
      });
    });

    it('VALID: block => asserts exact values, the full transition, and two of anything discriminated', () => {
      expect({
        onePerObservable: inWorker('**One assertion per observable**'),
        exactValues: inWorker('exact text, exact count, exact\n  state'),
        noVisibleStandIn: inWorker('never a weaker `toBeVisible()` stand-in'),
        fullTransition: inWorker(
          '**Assert the full transition**: the request that went out, the old state gone, the new state\n  visible.',
        ),
        twoOfAnything: inWorker('**Two of anything an assertion must discriminate.**'),
        offByIndexPasses: inWorker('an off-by-index bug passes'),
      }).toStrictEqual({
        onePerObservable: true,
        exactValues: true,
        noVisibleStandIn: true,
        fullTransition: true,
        twoOfAnything: true,
        offByIndexPasses: true,
      });
    });

    // Seeding a precondition is fine; performing the named mutation around the UI removes the control,
    // the handler and the request body — everything the walk exists to observe.
    it('VALID: block => drives the named mutation through the UI and waits on elements', () => {
      expect({
        throughTheUi: inWorker('**Drive state through the UI, not around it.**'),
        preconditionIsFine: inWorker(
          'Seeding a PRECONDITION through the server or the\n  file system is fine',
        ),
        namedMutationIsNot: inWorker(
          'performing the mutation the test is NAMED for that way is not',
        ),
        whatItSkips: inWorker('it skips the\n  control, the handler and the request body'),
        noSleep: inWorker('**Wait for elements, never for a duration.**'),
        sleepIsAFlake: inWorker('An arbitrary sleep is a flake with a timer on it.'),
      }).toStrictEqual({
        throughTheUi: true,
        preconditionIsFine: true,
        namedMutationIsNot: true,
        whatItSkips: true,
        noSleep: true,
        sleepIsAFlake: true,
      });
    });

    // Red-first is impossible when the behaviour already works, which is the common case for a walk
    // authored after the implementation landed — so the mutation route is spelled out with its revert.
    it('VALID: block => proves each case bites by a witnessed red or a reverted mutation', () => {
      expect({
        watchItFail: inWorker(
          '**Watch each new case fail before you make it pass, and capture the failure output.**',
        ),
        mutationRoute: inWorker('prove the test bites by **mutation**'),
        breakRunRevert: inWorker(
          'break the production line it guards, run it, capture the red, revert it, and confirm the file reads\nexactly as it did before',
        ),
      }).toStrictEqual({
        watchItFail: true,
        mutationRoute: true,
        breakRunRevert: true,
      });
    });

    it('VALID: block => may fix a defect it exposes but never edits shared e2e scaffolding', () => {
      expect({
        mayFix: inWorker('**You may fix a genuine defect your walk exposes**'),
        redFirstAndReport: inWorker('red test first, and report it in your return'),
        closeNotRebuild: inWorker('Close the hole;\ndo not rebuild the feature.'),
        neverConfigOrHarness: inWorker(
          "**Never edit the Playwright config, and never edit a harness another flow's session owns.**",
        ),
        lastWriteWins: inWorker('an edit there is last-write-wins'),
        askInsteadOfReaching: inWorker(
          'If your\nwalk needs a lever no harness carries, say so in your return rather than reaching for one.',
        ),
      }).toStrictEqual({
        mayFix: true,
        redFirstAndReport: true,
        closeNotRebuild: true,
        neverConfigOrHarness: true,
        lastWriteWins: true,
        askInsteadOfReaching: true,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    // Interpolated, never copied: the evidence contract is the shared spine of every verification
    // track, and a pack-local copy is the one that drifts when the false-green catalogue grows.
    it('VALID: block => interpolates the shared evidence contract exactly once', () => {
      const { reviewerMarkdown } = disciplineBrowserE2eStatics;

      expect({
        occurrences: reviewerMarkdown.split(flowEvidenceContractStatics.judgingMarkdown).length - 1,
        leadsWithIt: reviewerMarkdown.startsWith(flowEvidenceContractStatics.judgingMarkdown),
        carriesTheAuthoringHalf: reviewerMarkdown.includes(
          flowEvidenceContractStatics.authoringMarkdown,
        ),
      }).toStrictEqual({
        occurrences: 1,
        leadsWithIt: true,
        carriesTheAuthoringHalf: false,
      });
    });

    // The five standing concerns are discipline-independent and the reviewer template carries them
    // beside this slot. A pack-local restatement is a second copy an agent reads instead of the one
    // that gets maintained.
    it('VALID: block => restates none of the standing standards-review concerns', () => {
      const concerns = ['dedup', 'integrity', 'test-cases', 'get-blight-checklist'];

      expect({
        sharedBlock: inReviewer(standardsReviewConcernsStatics.markdown),
        concernNames: concerns.filter((concern) => inReviewer(concern)),
      }).toStrictEqual({
        sharedBlock: false,
        concernNames: [],
      });
    });

    // The template owns the return shape; a pack that repeats a field name is a second place to edit
    // when one changes, and the orchestrator routes on the template's spelling.
    it('VALID: every block => restates none of the reviewer template return fields', () => {
      const fields = [
        'VERDICT:',
        'PIECES:',
        'FIXES MADE:',
        'REMAINDER:',
        'UNFIXABLE:',
        'SIGNOFFS WRITTEN:',
        'WARD:',
      ];

      expect({
        orchestrator: fields.filter((field) => inOrchestrator(field)),
        planner: fields.filter((field) => inPlanner(field)),
        worker: fields.filter((field) => inWorker(field)),
        reviewer: fields.filter((field) => inReviewer(field)),
      }).toStrictEqual({
        orchestrator: [],
        planner: [],
        worker: [],
        reviewer: [],
      });
    });

    // Two denominators write ONE field over disjoint package kinds, so a reviewer that thinks it is
    // settling units generally signs the wrong side's work and leaves its own gate refusing.
    it('VALID: block => signs flowriderSignoff over the disjoint browser-reachable half, batched', () => {
      expect({
        sameFieldDisjoint: inReviewer(
          'You write `flowriderSignoff` over the browser-reachable package kinds; Flowrider writes the SAME\nfield over the DISJOINT complement',
        ),
        neverSettlesTheirs: inReviewer('signing one of yours never settles one of its units'),
        confirmedBar: inReviewer(
          '`confirmed` carries a test `file:line` PLUS what makes that test fail',
        ),
        unconfirmableBar: inReviewer(
          '`unconfirmable` carries what was tried, why each attempt could not reach it, and a `question`\nsomeone else can pick up',
        ),
        batched: inReviewer(
          '**BATCH the writes** — one `modify-quest` call carrying many, never one\nper unit',
        ),
      }).toStrictEqual({
        sameFieldDisjoint: true,
        neverSettlesTheirs: true,
        confirmedBar: true,
        unconfirmableBar: true,
        batched: true,
      });
    });

    // An `unconfirmable` closes a unit permanently while sounding responsible, so it is where a
    // deferral hides — including a predecessor's, which nothing else in the relay ever re-reads.
    it('VALID: block => audits every unconfirmable, a predecessor included, and owns what it reopens', () => {
      expect({
        audit: inReviewer("**AUDIT EVERY `unconfirmable`, a predecessor's included.**"),
        soundsResponsible: inReviewer(
          'It closes a unit permanently while\nsounding responsible, so deferral hides there',
        ),
        reopenAssignments: inReviewer(
          'Reopen any whose evidence names an assignment rather\nthan a wall',
        ),
        ownership: inReviewer('What you reopen, you own.'),
      }).toStrictEqual({
        audit: true,
        soundsResponsible: true,
        reopenAssignments: true,
        ownership: true,
      });
    });

    // A hidden tab throttles rAF and stops frame-committed layout, so nodes read invisible with
    // zero-ish boxes — indistinguishable from a product bug unless the reviewer knows the mechanism.
    it('VALID: block => catalogues the browser-walk false greens including the hidden-tab reading', () => {
      expect({
        passesAgainstBroken: inReviewer('An assertion that would pass against a broken product.'),
        hiddenTab: inReviewer('**A geometry or visibility finding taken from a hidden tab.**'),
        mechanism: inReviewer(
          'A backgrounded tab reads\n  `visibilityState: "hidden"`, which throttles `requestAnimationFrame` and stops frame-committed\n  layout',
        ),
        looksLikeABug: inReviewer(
          'so nodes read as invisible with zero-ish boxes — it looks exactly like a product bug',
        ),
        visibleStandIn: inReviewer('A `toBeVisible()` standing in for an exact-text claim.'),
        duplicateSpec: inReviewer('A spec that duplicates a path an existing spec already walked.'),
      }).toStrictEqual({
        passesAgainstBroken: true,
        hiddenTab: true,
        mechanism: true,
        looksLikeABug: true,
        visibleStandIn: true,
        duplicateSpec: true,
      });
    });

    // The contested rule: the ban is on AUTHORED specs manufacturing their own values, not on a
    // hand-driven measurement patching the fetch boundary. Stated as resolved, with the side this
    // track lands on.
    it('VALID: block => binds the intercept ban to authored specs and rejects intercepted evidence', () => {
      expect({
        resolved: inReviewer(
          '**One rule the post-mortem left contested, resolved: the intercept ban binds AUTHORED specs.**',
        ),
        theBan: inReviewer(
          'A\nPlaywright spec must not `page.route` its own backend to manufacture a value.',
        ),
        siegemastersException: inReviewer(
          "A hand-driven\nmeasurement in a live browser — Siegemaster's modality, not yours — may patch the fetch boundary",
        ),
        bindsHere: inReviewer('on\nthis track you are authoring, so the ban binds you'),
        rejectEvidence: inReviewer(
          '**Do not accept a `confirmed` whose evidence\ncame from an intercepted route.**',
        ),
      }).toStrictEqual({
        resolved: true,
        theBan: true,
        siegemastersException: true,
        bindsHere: true,
        rejectEvidence: true,
      });
    });

    // A file count is not a test count, and an e2e suite that discovered specs without running them
    // reports green in seconds — the one green that has to be re-read rather than accepted.
    it('VALID: block => refuses an impossibly fast green until per-test durations are read', () => {
      expect({
        refuseIt: inReviewer(
          '**If a green run looks impossibly fast for the work it claims, do not accept it.**',
        ),
        detailCall: inReviewer('`npm run ward -- detail <runId>`'),
        realDurations: inReviewer('confirm real per-test durations'),
        countIsNotACount: inReviewer(
          'A "discovered" file count is\nnot a count of tests that ran.',
        ),
      }).toStrictEqual({
        refuseIt: true,
        detailCall: true,
        realDurations: true,
        countIsNotACount: true,
      });
    });
  });
});
