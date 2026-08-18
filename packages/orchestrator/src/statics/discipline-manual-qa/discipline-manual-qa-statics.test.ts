import { disciplineManualQaStatics } from './discipline-manual-qa-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineManualQaStatics;

// A tool named in an operator's discipline block is a GRANT — the operator template's table says so
// in as many words. Every name here is on that template's FORBIDDEN half. The dev server and
// `reset-flow-signoffs` are the deliberate exceptions this pack DOES grant, and they are asserted
// separately below.
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

describe('disciplineManualQaStatics', () => {
  it('VALID: exported value => carries exactly the four blocks, all non-empty strings', () => {
    expect(disciplineManualQaStatics).toStrictEqual({
      operatorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  describe('operatorMarkdown is two fields and nothing else', () => {
    it('VALID: operatorMarkdown => carries exactly RESOURCE and RESET, in that order', () => {
      expect(
        Array.from(operatorMarkdown.matchAll(/\*\*([A-Z]+):/gu)).map((match) => match[1]),
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

    // This is the discipline where the operator's block earns its two non-"none" fields: it is the
    // session that starts and owns the ONE dev server, and the session that pulls the ONE reset
    // lever between workers. Naming a tool here IS the grant, so both have to be named.
    it('VALID: RESOURCE => grants the dev server, demands it in every brief, and bounds the teardown', () => {
      expect({
        namingIsTheGrant: operatorMarkdown.includes(
          '**RESOURCE: the dev server, and naming it here IS your grant to run it.**',
        ),
        bothValues: operatorMarkdown.includes('`Dev Server Command` and\n`Dev Server URL`'),
        ownItAllSession: operatorMarkdown.includes('own it for the whole\nsession'),
        everyBrief: operatorMarkdown.includes('**Put both values in EVERY minion brief**'),
        minionFetchCarriesNeither: operatorMarkdown.includes(
          "a minion's\nown fetch carries neither",
        ),
        noWorkerMayBounceIt: operatorMarkdown.includes('no worker may start, restart or stop it'),
        scopedKill: operatorMarkdown.includes('**Kill only what you\nstarted**'),
        portAndCwd: operatorMarkdown.includes('match port AND cwd'),
        neverPkill: operatorMarkdown.includes('never `pkill` a bare name or\nport'),
        wontStartIsADefect: operatorMarkdown.includes(
          "A server that will not start on THIS QUEST'S code is a defect",
        ),
      }).toStrictEqual({
        namingIsTheGrant: true,
        bothValues: true,
        ownItAllSession: true,
        everyBrief: true,
        minionFetchCarriesNeither: true,
        noWorkerMayBounceIt: true,
        scopedKill: true,
        portAndCwd: true,
        neverPkill: true,
        wontStartIsADefect: true,
      });
    });

    // Called ZERO times in 334 audited turns, with 52 units signed against pre-fix code. The whole
    // reason it goes unpulled is that it reads as an admission of failure, so the block says twice
    // over that it is free.
    it('VALID: RESET => grants the lever, names when to pull it, and says it is free', () => {
      expect({
        theCall: operatorMarkdown.includes(
          '**RESET: `reset-flow-signoffs({ questId, workItemId, flowId, reason })`.**',
        ),
        whenToPullIt: operatorMarkdown.includes(
          'Pull it whenever a worker\nreports a fix, before you dispatch the next one',
        ),
        whyItMatters: operatorMarkdown.includes(
          'sign-offs already written describe a system that\nCHANGED',
        ),
        free: operatorMarkdown.includes('**Resets are FREE**'),
        noAttempt: operatorMarkdown.includes('no pt-chain attempt, no admission of failure'),
        onlyThisFlow: operatorMarkdown.includes('only your own track\non this one flow clears'),
        theMeasurement: operatorMarkdown.includes(
          'It was called ZERO times in 334 audited turns, with 52 units signed against\npre-fix code.',
        ),
      }).toStrictEqual({
        theCall: true,
        whenToPullIt: true,
        whyItMatters: true,
        free: true,
        noAttempt: true,
        onlyThisFlow: true,
        theMeasurement: true,
      });
    });
  });

  // THE PACK THE GENERIC WORKER TEMPLATE EXISTS FOR. A manual-QA worker resets a live system, drives
  // a route by hand, and stops at the first defect — it shells nothing and writes no failing test
  // first, so a template that hard-coded that method was wrong here for four disciplines out of five.
  describe('workerMarkdown carries the two headings the worker template points at', () => {
    it('VALID: workerMarkdown => carries ### The work and ### The proof, work first', () => {
      expect({
        work: /^### The work$/mu.test(workerMarkdown),
        proof: /^### The proof$/mu.test(workerMarkdown),
        workFirst: workerMarkdown.indexOf('### The work') < workerMarkdown.indexOf('### The proof'),
      }).toStrictEqual({ work: true, proof: true, workFirst: true });
    });

    it('VALID: ### The work => is a hand-driven walk that stops at the first defect', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        steps: Array.from(work.matchAll(/^\d\. \*\*/gmu)).map((match) => match[0]),
        resetFirst: work.includes('**Reset before EVERY path**'),
        expectBeforeYouDrive: work.includes('**Learn the expected value BEFORE you drive.**'),
        rationalisesOtherwise: work.includes('rationalises whatever it sees'),
        driveTheRealSurface: work.includes(
          '**Drive the route by hand at the surface the brief names.**',
        ),
        forceEveryBranch: work.includes('**Force every branch and reach every terminal.**'),
        checkForDamage: work.includes('**After\n   any error branch, check for damage**'),
        whereItLives: work.includes('**Check each unit where it actually lives.**'),
        stopAtTheFirst: work.includes('**STOP at the first defect.**'),
        recordBrokenBeforeFixing: work.includes('**Record its BROKEN state BEFORE you fix it**'),
        neverGradeYourOwn: work.includes(
          '**Never continue past your own repair, and never grade it.**',
        ),
        freshWorkerReWalks: work.includes('A FRESH worker re-walks this slice'),
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **', '4. **'],
        resetFirst: true,
        expectBeforeYouDrive: true,
        rationalisesOtherwise: true,
        driveTheRealSurface: true,
        forceEveryBranch: true,
        checkForDamage: true,
        whereItLives: true,
        stopAtTheFirst: true,
        recordBrokenBeforeFixing: true,
        neverGradeYourOwn: true,
        freshWorkerReWalks: true,
      });
    });

    // The proof on this discipline is a per-unit WALK RECORD, and `BROKEN WOULD SHOW` is the whole
    // falsifiability check: a measurement whose result was fixed by construction proves nothing.
    it('VALID: ### The proof => is the per-unit walk record with BROKEN WOULD SHOW', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        precondition: proof.includes('PRECONDITION:'),
        did: proof.includes('DID:'),
        observed: proof.includes('OBSERVED:'),
        brokenWouldShow: proof.includes('BROKEN WOULD SHOW:'),
        valueNeverAdjective: proof.includes('A value, never an adjective'),
        theWalkRecordIsTheEvidence: proof.includes('**This walk record IS your evidence**'),
        cleanOrDefect: proof.includes('`RESULT` says CLEAN'),
        grepYourOwnDraft: proof.includes('**Grep your own draft for "confirmed"'),
        secondRunForPerf: proof.includes('needs the SECOND run of\nthe action'),
        oneRowCannotTellFlatFromQuadratic: proof.includes(
          'one row cannot tell flat from quadratic',
        ),
        hiddenTab: proof.includes('**A backgrounded tab reads `visibilityState: "hidden"`**'),
        zeroDefectsIsGood: proof.includes('**ZERO DEFECTS IS A GOOD ANSWER.**'),
        zeroDefectsIsContinue: proof.includes('is `NEXT: continue`'),
      }).toStrictEqual({
        precondition: true,
        did: true,
        observed: true,
        brokenWouldShow: true,
        valueNeverAdjective: true,
        theWalkRecordIsTheEvidence: true,
        cleanOrDefect: true,
        grepYourOwnDraft: true,
        secondRunForPerf: true,
        oneRowCannotTellFlatFromQuadratic: true,
        hiddenTab: true,
        zeroDefectsIsGood: true,
        zeroDefectsIsContinue: true,
      });
    });

    it('VALID: workerMarkdown => forbids touching the dev server its parent owns', () => {
      expect({
        notYours: workerMarkdown.includes('**The dev server is not yours.**'),
        neverBounceIt: workerMarkdown.includes('Never start, restart or stop it'),
        exactlyOne: workerMarkdown.includes('there is exactly ONE, your parent owns it'),
        bounceWipesTheCanvas: workerMarkdown.includes(
          'a bounce wipes the canvas under\nwhichever worker is mid-walk',
        ),
        deadUrlIsRework: workerMarkdown.includes(
          'If the URL does not answer, stop and say so in `NEXT: rework`',
        ),
        observationNotASuite: workerMarkdown.includes('**Verification means OBSERVATION**'),
      }).toStrictEqual({
        notYours: true,
        neverBounceIt: true,
        exactlyOne: true,
        bounceWipesTheCanvas: true,
        deadUrlIsRework: true,
        observationNotASuite: true,
      });
    });
  });

  // What moved DOWN from the operator block, plus the instrument design only this session can do.
  describe('plannerMarkdown holds the scope framing and designs the instruments', () => {
    it('VALID: plannerMarkdown => carries the framing the operator block used to relay', () => {
      expect({
        pathsVersusUnits: plannerMarkdown.includes(
          '**Paths are the ITINERARY; units are the DEFINITION OF DONE.**',
        ),
        classicUnderDelivery: plannerMarkdown.includes("this role's classic under-delivery"),
        lastToFixBehaviour: plannerMarkdown.includes(
          '**This round is the LAST that fixes BEHAVIOUR.**',
        ),
        securityAndPerfAreYours: plannerMarkdown.includes('**Security and performance are yours**'),
        notEveryFlowHasAUi: plannerMarkdown.includes('**Not every flow has a UI.**'),
        curlIsFirstClass: plannerMarkdown.includes('first-class QA instruments'),
      }).toStrictEqual({
        pathsVersusUnits: true,
        classicUnderDelivery: true,
        lastToFixBehaviour: true,
        securityAndPerfAreYours: true,
        notEveryFlowHasAUi: true,
        curlIsFirstClass: true,
      });
    });

    it('VALID: plannerMarkdown => designs all four instruments as recipes rather than descriptions', () => {
      expect({
        asACommand: plannerMarkdown.includes('as a command or a recipe, never a description'),
        inventedDifferently: plannerMarkdown.includes(
          'An instrument a\nworker has to invent gets invented differently in every slice',
        ),
        resetLever: plannerMarkdown.includes('**1. The seed/reset lever'),
        proveItTwice: plannerMarkdown.includes('prove it by using it TWICE.**'),
        discriminatingCanvas: plannerMarkdown.includes('**2. A DISCRIMINATING canvas'),
        twoOfAnything: plannerMarkdown.includes(
          '**at least two of\nanything an assertion must tell apart**',
        ),
        faultLever: plannerMarkdown.includes('**3. A fault lever.**'),
        browserSurface: plannerMarkdown.includes(
          '**4. Establish the real browser surface before planning any browser slice.**',
        ),
        probeWhatYouWillDrive: plannerMarkdown.includes(
          '**So probing `tabs_context_mcp` does NOT test\nusability — probe the one you will actually drive with.**',
        ),
        neverDeclareNoBrowserToSkip: plannerMarkdown.includes(
          '**Never\ndeclare "no browser" as a way to skip the harder walk.**',
        ),
      }).toStrictEqual({
        asACommand: true,
        inventedDifferently: true,
        resetLever: true,
        proveItTwice: true,
        discriminatingCanvas: true,
        twoOfAnything: true,
        faultLever: true,
        browserSurface: true,
        probeWhatYouWillDrive: true,
        neverDeclareNoBrowserToSkip: true,
      });
    });

    // Each of these cost a prior session real wall-clock, and none of them is derivable from the
    // code. A worker that has to rediscover one spends its slice on that instead of the walk.
    it('VALID: plannerMarkdown => carries the durable environment knowledge, for every chunk', () => {
      expect({
        heading: plannerMarkdown.includes(
          '## Durable environment knowledge — put it in EVERY chunk',
        ),
        ipv6: plannerMarkdown.includes('**The dev server binds IPv6-only**'),
        webSocketOffline: plannerMarkdown.includes(
          '**`context.setOffline(true)` does NOT close an established WebSocket in Chromium**',
        ),
        orchestratorBarrel: plannerMarkdown.includes(
          '**Importing the orchestrator barrel boots real intervals and fs watchers**',
        ),
        noHeredocs: plannerMarkdown.includes(
          "**This repo's Bash static analyzer rejects `python3` heredocs",
        ),
        spikeTmp: plannerMarkdown.includes('**under `spike-tmp/`**'),
        curlRetry: plannerMarkdown.includes(
          'curl -sf --retry 15 --retry-delay 2 --retry-connrefused',
        ),
        diagnosticNotKept: plannerMarkdown.includes(
          '**Your spike is DIAGNOSTIC on this discipline, not kept.**',
        ),
      }).toStrictEqual({
        heading: true,
        ipv6: true,
        webSocketOffline: true,
        orchestratorBarrel: true,
        noHeredocs: true,
        spikeTmp: true,
        curlRetry: true,
        diagnosticNotKept: true,
      });
    });

    it('VALID: plannerMarkdown => writes a ward command per chunk, keyed on where a fix would land', () => {
      expect({
        byWhereAFixLands: plannerMarkdown.includes(
          '**`WARD` per chunk, by where a fix would land.**',
        ),
        pureLogic: plannerMarkdown.includes('`--only lint,typecheck,unit` for a pure-logic fix'),
        flowsAndStartup: plannerMarkdown.includes('`--only lint,typecheck,unit,integration` when'),
        paintedGeometry: plannerMarkdown.includes('`--only lint,typecheck,e2e` when painted'),
      }).toStrictEqual({
        byWhereAFixLands: true,
        pureLogic: true,
        flowsAndStartup: true,
        paintedGeometry: true,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    it('VALID: reviewerMarkdown => rejects on sight the seven hand-waves that shipped on this repo', () => {
      expect({
        coverageIsMechanical: reviewerMarkdown.includes('## Coverage first, and it is mechanical'),
        missingIdsGoBack: reviewerMarkdown.includes('Missing ids are not a\njudgement call'),
        adjectives: reviewerMarkdown.includes('**Adjectives where values belong.**'),
        cannotComeOutDifferently: reviewerMarkdown.includes(
          '**A measurement incapable of coming out differently.**',
        ),
        suiteInsteadOfWalk: reviewerMarkdown.includes(
          '**A suite run offered in place of a walk.**',
        ),
        simplifiedCanvas: reviewerMarkdown.includes('**A canvas the worker simplified.**'),
        requestFired: reviewerMarkdown.includes(
          '**A `custom` unit reduced to "a request fired".**',
        ),
        nonDomInTheDom: reviewerMarkdown.includes('**A non-DOM unit checked in the DOM.**'),
        hiddenTab: reviewerMarkdown.includes(
          '**A geometry or visibility finding from a hidden tab.**',
        ),
        fixedWithNoRedTest: reviewerMarkdown.includes(
          '**A defect reported as fixed with no red test.**',
        ),
      }).toStrictEqual({
        coverageIsMechanical: true,
        missingIdsGoBack: true,
        adjectives: true,
        cannotComeOutDifferently: true,
        suiteInsteadOfWalk: true,
        simplifiedCanvas: true,
        requestFired: true,
        nonDomInTheDom: true,
        hiddenTab: true,
        fixedWithNoRedTest: true,
      });
    });

    it('VALID: reviewerMarkdown => writes siegemasterSignoff, batched, in a two-verdict vocabulary', () => {
      expect({
        theTrack: reviewerMarkdown.includes('One `siegemasterSignoff` per unit'),
        confirmed: reviewerMarkdown.includes('| `confirmed` | measured off the running system'),
        unconfirmable: reviewerMarkdown.includes(
          '| `unconfirmable` | no surface available settles it',
        ),
        bothClear: reviewerMarkdown.includes('Both verdicts CLEAR a unit'),
        batch: reviewerMarkdown.includes('**BATCH the writes: ONE `modify-quest` call**'),
        idPlusFieldOnly: reviewerMarkdown.includes(
          'A\nsigning element carries ONLY its `id` plus the sign-off field',
        ),
        noteNeverClosesAUnit: reviewerMarkdown.includes(
          '**A `questNotes` entry NEVER closes a unit; only a sign-off does.**',
        ),
        measuredDefectIsAdded: reviewerMarkdown.includes(
          '**An observable the round MEASURED into existence**',
        ),
        addedBy: reviewerMarkdown.includes("`addedBy: 'siegemaster'`"),
      }).toStrictEqual({
        theTrack: true,
        confirmed: true,
        unconfirmable: true,
        bothClear: true,
        batch: true,
        idPlusFieldOnly: true,
        noteNeverClosesAUnit: true,
        measuredDefectIsAdded: true,
        addedBy: true,
      });
    });

    // A behaviour change here invalidates the clean walks the round just bought, so the audit is
    // MUTATION-ONLY and a suspected defect routes to a fresh walk rather than a fix in place.
    it('VALID: reviewerMarkdown => runs a mutation-only audit and routes a suspected defect to rework', () => {
      expect({
        heading: reviewerMarkdown.includes('## The mutation audit'),
        revertByEditing: reviewerMarkdown.includes(
          'revert BY EDITING the line back (never `git checkout --`)',
        ),
        mutationOnly: reviewerMarkdown.includes('It is **MUTATION-ONLY**'),
        wouldInvalidateTheWalks: reviewerMarkdown.includes(
          'a behaviour change now invalidates the clean walks this round just bought',
        ),
        suspectedDefectIsRework: reviewerMarkdown.includes(
          'A\nsuspected defect is `NEXT: rework` for a fresh walk, never fixed here.',
        ),
        banIsOnProductBehaviour: reviewerMarkdown.includes(
          '**That ban is on PRODUCT BEHAVIOUR UNDER WALK, and on nothing else.**',
        ),
        emptySetFallback: reviewerMarkdown.includes(
          "audit the tests that COVER the flow's units instead",
        ),
      }).toStrictEqual({
        heading: true,
        revertByEditing: true,
        mutationOnly: true,
        wouldInvalidateTheWalks: true,
        suspectedDefectIsRework: true,
        banIsOnProductBehaviour: true,
        emptySetFallback: true,
      });
    });

    // Two roles read the fetch-intercept rule and reached opposite verdicts on six units. It binds
    // AUTHORED specs; a hand-driven measurement is this discipline's own modality.
    it('VALID: reviewerMarkdown => resolves the fetch-intercept rule in this modality favour', () => {
      expect({
        bindsAuthoredSpecs: reviewerMarkdown.includes(
          'The fetch-intercept ban binds **AUTHORED specs**',
        ),
        handDrivenMayPatch: reviewerMarkdown.includes(
          '**A hand-driven MEASUREMENT in a live browser MAY patch the fetch boundary to force a\nvalue**',
        ),
        namesTheLever: reviewerMarkdown.includes('the resulting sign-off names the lever'),
        sixUnitsStand: reviewerMarkdown.includes('the six units it was contested over stand'),
      }).toStrictEqual({
        bindsAuthoredSpecs: true,
        handDrivenMayPatch: true,
        namesTheLever: true,
        sixUnitsStand: true,
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
