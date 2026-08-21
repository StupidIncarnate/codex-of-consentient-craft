import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { reviewerMinionStatics } from '../reviewer-minion/reviewer-minion-statics';
import { disciplineManualQaStatics } from './discipline-manual-qa-statics';

const { operatorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineManualQaStatics;

// CROSS-FILE NEEDLES. Everything below is read off the PRODUCING module's live value. A copy of
// either sentence written down here would drift exactly the way the prose drifts, and go quiet.

// `agentOperatingRulesStatics.wallMinion` is embedded above every worker block. That [WALL] rule
// carries the restartable-resource carve-out this pack's worker block has to agree with. The two
// verdict tokens come out of that sentence rather than being spelled again.
const SHARED_RESTARTABLE_RESOURCE_RULE =
  /\*\*A wall your parent can clear by restarting a resource it owns is `(?<rework>[^`]+)`, not `(?<wall>[^`]+)`\.\*\*/u.exec(
    agentOperatingRulesStatics.wallMinion,
  );

const RESTARTABLE_IS_REWORK = SHARED_RESTARTABLE_RESOURCE_RULE?.groups?.rework ?? '';
const RESTARTABLE_IS_NOT_WALL = SHARED_RESTARTABLE_RESOURCE_RULE?.groups?.wall ?? '';

// This pack's operator block cites the environment-wall rule BY TAG. The tag is read off the
// shared rule itself, so a retagging there fails here instead of leaving a live citation pointing
// at a rule that no longer exists.
const ENVIRONMENT_WALL_RULE_TAG = /^\*\*\[(?<tag>[A-Z ]+)\]/u.exec(
  agentOperatingRulesStatics.wallRole,
)?.groups?.tag;

// The reviewer template's "What is not yours" entry is where the ward ban and its carve-out live.
// This pack's mutation audit has to be a run that entry PERMITS rather than the one it bans.
const REVIEWER_TEMPLATE_NOT_YOURS = reviewerMinionStatics.prompt.template.slice(
  reviewerMinionStatics.prompt.template.indexOf('## What is not yours'),
  reviewerMinionStatics.prompt.template.indexOf('## What you return'),
);

// A tool named in an operator's discipline block is a PERMISSION. The operator template's table
// says so in as many words. Every name here sits on that template's FORBIDDEN half. The dev server
// and `reset-flow-signoffs` are the two exceptions this pack DOES permit. The tests below assert
// those two separately.
const FORBIDDEN_IN_AN_OPERATOR_BLOCK = [
  'get-architecture',
  'get-syntax-rules',
  'get-testing-patterns',
  'discover',
  'get-project-map',
  'get-project-inventory',
  'get-folder-detail',
  'get-blight-checklist',
  'get-qa-checklist',
  'npm run ward',
  'git log',
  'git diff',
  'git commit',
  'Read',
  'Edit',
  'Write',
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

    // This is the discipline where the operator's block earns its two non-"none" fields. The
    // operator starts and owns the ONE dev server. It also pulls the ONE reset lever between
    // workers. Naming a tool here IS the permission, so the block has to name both.
    it('VALID: RESOURCE => permits the dev server, demands it in every brief, and bounds the teardown', () => {
      expect({
        namingIsThePermission: operatorMarkdown.includes(
          '**RESOURCE: the dev server. Naming it here IS your permission to run it.**',
        ),
        bothValues: operatorMarkdown.includes('`Dev Server Command`\nand `Dev Server URL`'),
        exactlyOneServer: operatorMarkdown.includes('Run ONE, in this order:'),
        standItUpBeforeStep3: operatorMarkdown.includes('1. Stand it up before step 3.'),
        ownItAllSession: operatorMarkdown.includes('2. Own it for the whole session.'),
        everyBrief: operatorMarkdown.includes('3. Put both values in EVERY minion brief.'),
        minionFetchCarriesNeither: operatorMarkdown.includes(
          "A minion's own fetch carries neither.",
        ),
        tearItDownBeforeYouSignal: operatorMarkdown.includes('4. Tear it down before you signal.'),
        noWorkerMayBounceIt: operatorMarkdown.includes(
          '**No worker may start, restart or stop it.**',
        ),
        scopedKill: operatorMarkdown.includes('**Kill only what you started.**'),
        portAndCwd: operatorMarkdown.includes('Match port AND cwd'),
        neverPkill: operatorMarkdown.includes('Never `pkill` a bare name or port.'),
        wontStartIsADefect: operatorMarkdown.includes(
          "A server that will not start\non THIS QUEST'S code is a defect for the round to fix, not a wall.",
        ),
        aHeldPortIsAWall: operatorMarkdown.includes(
          "A port held outside your cwd is\nthe [WALL] rule's wall. So is a missing runtime.",
        ),
      }).toStrictEqual({
        namingIsThePermission: true,
        bothValues: true,
        exactlyOneServer: true,
        standItUpBeforeStep3: true,
        ownItAllSession: true,
        everyBrief: true,
        minionFetchCarriesNeither: true,
        tearItDownBeforeYouSignal: true,
        noWorkerMayBounceIt: true,
        scopedKill: true,
        portAndCwd: true,
        neverPkill: true,
        wontStartIsADefect: true,
        aHeldPortIsAWall: true,
      });
    });

    // Prior sessions pulled this lever ZERO times in 334 audited turns. Those rounds signed 52
    // units against pre-fix code. The lever goes unpulled because it reads as an admission of
    // failure, so the block says twice over that a reset is free.
    it('VALID: RESET => permits the lever, names when to pull it, and says it is free', () => {
      expect({
        theCall: operatorMarkdown.includes(
          '**RESET: `reset-flow-signoffs({ questId, workItemId, flowId, reason })`.**',
        ),
        whenToPullIt: operatorMarkdown.includes(
          'Pull it whenever a worker\nreports a fix, before you dispatch the next one.',
        ),
        whyItMatters: operatorMarkdown.includes(
          'Sign-offs already written describe a system that\nCHANGED.',
        ),
        free: operatorMarkdown.includes('**Resets are FREE.**'),
        noAttempt: operatorMarkdown.includes(
          'They cost no pt-chain attempt. They admit no failure.',
        ),
        onlyThisFlow: operatorMarkdown.includes('Only your own\ntrack on this one flow clears.'),
        theMeasurement: operatorMarkdown.includes(
          'Prior sessions pulled it ZERO times in 334 audited turns. Those\nrounds signed 52 units against pre-fix code.',
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

    // CROSS-FILE PAIR — `agentOperatingRulesStatics.wallRole` ←→ this pack's
    // `operatorMarkdown`. RESOURCE routes a port held outside the operator's own cwd to the shared
    // Operating Rules' environment wall, and cites that rule BY TAG rather than restating it.
    // Retag the shared rules and the citation names a rule the operator cannot find — the operator
    // is then left with no stated route for a port it cannot free, and a scoped kill it must not
    // widen.
    it("VALID: RESOURCE => cites the shared Operating Rules' environment-wall rule by its real tag", () => {
      expect({
        sharedRulesStillTagTheEnvironmentWall: ENVIRONMENT_WALL_RULE_TAG !== undefined,
        packCitesThatSameTag: operatorMarkdown.includes(
          `the [${String(ENVIRONMENT_WALL_RULE_TAG)}] rule's wall`,
        ),
      }).toStrictEqual({
        sharedRulesStillTagTheEnvironmentWall: true,
        packCitesThatSameTag: true,
      });
    });
  });

  // THE PACK THE GENERIC WORKER TEMPLATE EXISTS FOR. A manual-QA worker resets a live system,
  // drives a route by hand, and stops at the first defect. It writes no failing test first and
  // stubs no implementation. A template that hard-coded that method was wrong for four disciplines
  // out of five.
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
        theRealBrowser: work.includes('- a real browser — click the real elements'),
        theRealEndpoint: work.includes(
          '- an endpoint — `curl` it, then read the real status and the real body',
        ),
        forceEveryBranch: work.includes('**Force every branch. Reach every terminal.**'),
        checkForDamage: work.includes('**After any error branch, check for damage**'),
        whereItLives: work.includes('**Check each unit where it actually lives.**'),
        stopAtTheFirst: work.includes('**STOP at the first defect.**'),
        recordBrokenBeforeFixing: work.includes('**Record its BROKEN state BEFORE you fix it.**'),
        neverGradeYourOwn: work.includes(
          '**Never continue past your own repair. Never grade it.**',
        ),
        freshWorkerReWalks: work.includes('A FRESH worker re-walks this slice'),
      }).toStrictEqual({
        steps: ['1. **', '2. **', '3. **', '4. **'],
        resetFirst: true,
        expectBeforeYouDrive: true,
        rationalisesOtherwise: true,
        driveTheRealSurface: true,
        theRealBrowser: true,
        theRealEndpoint: true,
        forceEveryBranch: true,
        checkForDamage: true,
        whereItLives: true,
        stopAtTheFirst: true,
        recordBrokenBeforeFixing: true,
        neverGradeYourOwn: true,
        freshWorkerReWalks: true,
      });
    });

    // The intercept ban carves out an exception for a hand-driven measurement. This worker is the
    // only session on any discipline that performs one. Stated to the reviewer alone, the exception
    // left workers signing `unconfirmable` on units they were permitted to force.
    it('VALID: ### The work => permits patching the fetch boundary and demands the lever be named', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        mayPatchTheBoundary: work.includes(
          '**You MAY patch the fetch boundary in the live browser to force a value.**',
        ),
        banBindsAuthoredSuites: work.includes(
          'The intercept ban\n   binds an AUTHORED Playwright suite. You are authoring none.',
        ),
        forcibleIsNotUnconfirmable: work.includes(
          'a unit you could have forced this way is never `unconfirmable`',
        ),
        evidenceNamesTheLever: work.includes(
          "Name the lever you pulled in that unit's `EVIDENCE` block.",
        ),
      }).toStrictEqual({
        mayPatchTheBoundary: true,
        banBindsAuthoredSuites: true,
        forcibleIsNotUnconfirmable: true,
        evidenceNamesTheLever: true,
      });
    });

    // `reset-flow-signoffs` is whole-flow only. Its input contract is `.strict()`, so a `unitId`
    // key throws. The worker owes the LIST of moved behaviours, never a per-unit reset.
    it('VALID: ### The work => asks for the moved behaviours and resets the whole flow track', () => {
      const work = workerMarkdown.slice(
        workerMarkdown.indexOf('### The work'),
        workerMarkdown.indexOf('### The proof'),
      );

      expect({
        theWorkerOwesTheList: work.includes(
          'name every already-walked behaviour your change could\n     have moved',
        ),
        theParentResetsTheFlow: work.includes(
          "Your parent then resets this whole flow's `siegemasterSignoff` track",
        ),
        neverAUnit: work.includes('because the\n     lever takes a flow and never a unit'),
        stillNamesAPerUnitReset: work.includes('resets the track on those'),
      }).toStrictEqual({
        theWorkerOwesTheList: true,
        theParentResetsTheFlow: true,
        neverAUnit: true,
        stillNamesAPerUnitReset: false,
      });
    });

    // The proof on this discipline is a per-unit WALK RECORD. `BROKEN WOULD SHOW` is the whole
    // check: a measurement whose result was fixed by construction proves nothing.
    it('VALID: ### The proof => is the per-unit walk record with BROKEN WOULD SHOW', () => {
      const proof = workerMarkdown.slice(workerMarkdown.indexOf('### The proof'));

      expect({
        precondition: proof.includes('PRECONDITION:'),
        did: proof.includes('DID:'),
        observed: proof.includes('OBSERVED:'),
        brokenWouldShow: proof.includes('BROKEN WOULD SHOW:'),
        valueNeverAdjective: proof.includes('A value, never an adjective'),
        theWalkRecordIsTheEvidence: proof.includes('**This walk record IS your evidence.**'),
        resultClean: proof.includes('| CLEAN | you walked the whole slice and found nothing |'),
        resultDefect: proof.includes(
          '| DEFECT | you stopped at a defect and fixed it, so the slice is incomplete |',
        ),
        grepYourOwnDraft: proof.includes('**Grep your own draft for "confirmed"'),
        secondRunForPerf: proof.includes('needs the SECOND run of\nthe action'),
        oneRowCannotTellFlatFromQuadratic: proof.includes(
          'One row cannot tell flat from quadratic',
        ),
        hiddenTab: proof.includes('**A backgrounded tab reads `visibilityState: "hidden"`.**'),
        screenshotForcesAFrame: proof.includes('1. Take a screenshot to force a frame.'),
        confirmVisibleBeforeMeasuring: proof.includes(
          "2. Confirm `document.visibilityState === 'visible'`.",
        ),
        zeroDefectsIsGood: proof.includes('**ZERO DEFECTS IS A GOOD ANSWER.**'),
        zeroDefectsIsContinue: proof.includes('is `NEXT: continue`'),
      }).toStrictEqual({
        precondition: true,
        did: true,
        observed: true,
        brokenWouldShow: true,
        valueNeverAdjective: true,
        theWalkRecordIsTheEvidence: true,
        resultClean: true,
        resultDefect: true,
        grepYourOwnDraft: true,
        secondRunForPerf: true,
        oneRowCannotTellFlatFromQuadratic: true,
        hiddenTab: true,
        screenshotForcesAFrame: true,
        confirmVisibleBeforeMeasuring: true,
        zeroDefectsIsGood: true,
        zeroDefectsIsContinue: true,
      });
    });

    it('VALID: workerMarkdown => forbids touching the dev server its parent owns', () => {
      expect({
        notYours: workerMarkdown.includes('**The dev server is not yours.**'),
        neverBounceIt: workerMarkdown.includes('Never start, restart or stop it'),
        exactlyOne: workerMarkdown.includes('There is exactly ONE. Your parent owns it.'),
        bounceWipesTheCanvas: workerMarkdown.includes(
          'Bouncing it wipes the canvas under\nwhichever worker is mid-walk.',
        ),
        canvasIsDefinedBeforeItIsUsed:
          workerMarkdown.indexOf('| the canvas | the seeded data your walk runs against |') <
          workerMarkdown.indexOf('Bouncing it wipes the canvas under'),
        observationNotASuite: workerMarkdown.includes('**Verification means OBSERVATION.**'),
      }).toStrictEqual({
        notYours: true,
        neverBounceIt: true,
        exactlyOne: true,
        bounceWipesTheCanvas: true,
        canvasIsDefinedBeforeItIsUsed: true,
        observationNotASuite: true,
      });
    });

    // The generic Operating Rules embedded ABOVE this block route an unreachable service to
    // `NEXT: wall`. A wall halts the whole quest. The dev server is the one service the worker's
    // own PARENT started and may restart, so this block has to state the routing itself. Otherwise
    // the absolute rule wins on read order.
    it('VALID: workerMarkdown => routes a dead dev-server URL to rework, never wall', () => {
      expect({
        reworkNotWall: workerMarkdown.includes(
          '**A URL that does not answer is `NEXT: rework`, never\n`NEXT: wall`.**',
        ),
        theParentStartedIt: workerMarkdown.includes('Your parent started that server.'),
        theParentCanRestartIt: workerMarkdown.includes(
          'Your parent holds the permission to restart it.',
        ),
        aReDispatchClearsIt: workerMarkdown.includes('A\nre-dispatch therefore clears this wall.'),
        sayWhichUrlDied: workerMarkdown.includes('Name the dead URL in `GOTCHAS`.'),
        stillRoutesWithoutTheReason: workerMarkdown.includes('say so in `NEXT: rework`'),
      }).toStrictEqual({
        reworkNotWall: true,
        theParentStartedIt: true,
        theParentCanRestartIt: true,
        aReDispatchClearsIt: true,
        sayWhichUrlDied: true,
        stillRoutesWithoutTheReason: false,
      });
    });

    // CROSS-FILE PAIR — `agentOperatingRulesStatics.wallMinion` ←→ this pack's
    // `workerMarkdown`. The shared rule says a wall the parent clears by RESTARTING a resource it
    // owns is `rework` rather than `wall`, and names a parent-started dev server as the case
    // minions get wrong. This block routes an unanswering Dev Server URL to the same two verdicts,
    // for the same stated reason. Both sides were made to agree by hand, by different agents, and
    // both have since been reworded, so the two verdict tokens here are read off the shared rule
    // rather than written down again.
    //
    // What breaks if they diverge: the worker returns `wall`. Its operator matches that one word,
    // stops dispatching, skips the reviewer entirely and signals `blocked` — halting the whole
    // quest over a server its own parent started and holds the permission to restart.
    it('VALID: a dev-server URL that does not answer => is rework on BOTH sides of the shared minion rule', () => {
      expect({
        sharedRuleStillCarvesOutARestartableResource: SHARED_RESTARTABLE_RESOURCE_RULE !== null,
        sharedRuleNamesTheDevServerAsTheCase: agentOperatingRulesStatics.wallMinion.includes(
          'A dev server your parent started is where minions get this wrong.',
        ),
        sharedRuleSaysARestartMakesItAnswer: agentOperatingRulesStatics.wallMinion.includes(
          `A URL that stops answering is \`${RESTARTABLE_IS_REWORK}\`, because a restart makes it answer again.`,
        ),
        packRoutesTheDeadUrlToThoseSameTwoVerdicts: workerMarkdown.includes(
          `**A URL that does not answer is \`${RESTARTABLE_IS_REWORK}\`, never\n\`${RESTARTABLE_IS_NOT_WALL}\`.**`,
        ),
        packGivesTheRestartAsTheReason: workerMarkdown.includes(
          'Your parent holds the permission to restart it.',
        ),
        packSaysARedispatchClearsIt: workerMarkdown.includes(
          'A\nre-dispatch therefore clears this wall.',
        ),
      }).toStrictEqual({
        sharedRuleStillCarvesOutARestartableResource: true,
        sharedRuleNamesTheDevServerAsTheCase: true,
        sharedRuleSaysARestartMakesItAnswer: true,
        packRoutesTheDeadUrlToThoseSameTwoVerdicts: true,
        packGivesTheRestartAsTheReason: true,
        packSaysARedispatchClearsIt: true,
      });
    });
  });

  // What moved DOWN from the operator block, plus the instrument design only this session can do.
  describe('plannerMarkdown holds the scope framing and designs the instruments', () => {
    it('VALID: plannerMarkdown => carries the framing the operator block used to relay', () => {
      expect({
        pathsVersusUnits: plannerMarkdown.includes(
          '**Paths are the ITINERARY. Units are the DEFINITION OF DONE.**',
        ),
        theClassicFailure: plannerMarkdown.includes(
          'This role fails most often by covering every path and leaving its units unmeasured.',
        ),
        lastToFixBehaviour: plannerMarkdown.includes(
          '**This round is the LAST that fixes BEHAVIOUR.**',
        ),
        securityAndPerfAreYours: plannerMarkdown.includes(
          '**Security and performance are yours.**',
        ),
        hostileInputIsTheSecurity: plannerMarkdown.includes(
          "The `hostile-input` probe\nfamily IS this quest's security coverage.",
        ),
        nobodyElseProbesEither: plannerMarkdown.includes('Nobody else probes either one.'),
        notEveryFlowHasAUi: plannerMarkdown.includes('**Not every flow has a UI.**'),
        curlIsAQaInstrument: plannerMarkdown.includes('`curl` and the real CLI are QA instruments'),
      }).toStrictEqual({
        pathsVersusUnits: true,
        theClassicFailure: true,
        lastToFixBehaviour: true,
        securityAndPerfAreYours: true,
        hostileInputIsTheSecurity: true,
        nobodyElseProbesEither: true,
        notEveryFlowHasAUi: true,
        curlIsAQaInstrument: true,
      });
    });

    it('VALID: plannerMarkdown => designs all four instruments as recipes rather than descriptions', () => {
      expect({
        asACommand: plannerMarkdown.includes(
          'as a command or a recipe. Never write a\ndescription.',
        ),
        inventedDifferently: plannerMarkdown.includes(
          'Each worker invents a missing instrument differently, so no two walks compare.',
        ),
        resetLever: plannerMarkdown.includes('**1. The seed/reset lever.'),
        proveItTwice: plannerMarkdown.includes('Prove it by using it TWICE.**'),
        discriminatingCanvas: plannerMarkdown.includes('**2. A DISCRIMINATING canvas.'),
        canvasIsDefinedBeforeItIsUsed:
          plannerMarkdown.indexOf('A canvas is the seeded data') <
          plannerMarkdown.indexOf('A canvas needs'),
        twoOfAnything: plannerMarkdown.includes(
          '**at least two of anything an assertion must tell\napart**',
        ),
        faultLever: plannerMarkdown.includes('**3. A fault lever.**'),
        browserSurface: plannerMarkdown.includes(
          '**4. Establish the real browser surface before planning any browser slice.**',
        ),
        probeWhatYouWillDrive: plannerMarkdown.includes(
          '**Probing `tabs_context_mcp` therefore\ndoes NOT test usability. Probe the tool you will actually drive with.**',
        ),
        playwrightNodeApiFallback: plannerMarkdown.includes(
          'driving Chromium through the **Playwright Node API**',
        ),
        noBrowserIsUnconfirmable: plannerMarkdown.includes(
          'every `ui-state` unit is `unconfirmable`. Its evidence is "no\nbrowser attached".',
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
        canvasIsDefinedBeforeItIsUsed: true,
        twoOfAnything: true,
        faultLever: true,
        browserSurface: true,
        probeWhatYouWillDrive: true,
        playwrightNodeApiFallback: true,
        noBrowserIsUnconfirmable: true,
        neverDeclareNoBrowserToSkip: true,
      });
    });

    // Each of these cost a prior session real wall-clock. None of them is derivable from the code.
    // A worker that has to rediscover one spends its slice on that instead of the walk.
    it('VALID: plannerMarkdown => carries the durable environment knowledge, for every chunk', () => {
      expect({
        heading: plannerMarkdown.includes('## Durable environment knowledge'),
        intoEveryChunk: plannerMarkdown.includes(
          "Put every fact below into EVERY chunk's `NOTES`.",
        ),
        ipv6: plannerMarkdown.includes('**The dev server binds IPv6-only.**'),
        webSocketOffline: plannerMarkdown.includes(
          '**`context.setOffline(true)` does NOT close an established WebSocket in Chromium.**',
        ),
        orchestratorBarrel: plannerMarkdown.includes(
          '**Importing the orchestrator barrel boots real intervals and fs watchers.**',
        ),
        noHeredocs: plannerMarkdown.includes(
          "**This repo's Bash static analyzer rejects `python3` heredocs",
        ),
        spikeTmp: plannerMarkdown.includes('**under `spike-tmp/`**'),
        untrackedBlocksTheSignal: plannerMarkdown.includes(
          "An untracked file blocks your parent's signal.",
        ),
        curlRetry: plannerMarkdown.includes(
          'curl -sf --retry 15 --retry-delay 2 --retry-connrefused',
        ),
        diagnosticNotKept: plannerMarkdown.includes(
          '**Your spike is DIAGNOSTIC on this discipline, not kept.**',
        ),
      }).toStrictEqual({
        heading: true,
        intoEveryChunk: true,
        ipv6: true,
        webSocketOffline: true,
        orchestratorBarrel: true,
        noHeredocs: true,
        spikeTmp: true,
        untrackedBlocksTheSignal: true,
        curlRetry: true,
        diagnosticNotKept: true,
      });
    });

    // The ward command per chunk is a lookup, so the block states it as a table rather than a
    // paragraph. Each row pins one fix location against the command it earns.
    it('VALID: plannerMarkdown => writes a ward command per chunk, keyed on where a fix would land', () => {
      expect({
        byWhereAFixLands: plannerMarkdown.includes(
          '**`WARD` per chunk, by where a fix would land.**',
        ),
        pureLogic: plannerMarkdown.includes('| pure logic | `--only lint,typecheck,unit` |'),
        flowsAndStartup: plannerMarkdown.includes(
          '| a `flows/` or `startup/` path in `FILES` | `--only lint,typecheck,unit,integration` |',
        ),
        paintedGeometry: plannerMarkdown.includes(
          '| painted geometry, provable only in a real browser | `--only lint,typecheck,e2e` |',
        ),
      }).toStrictEqual({
        byWhereAFixLands: true,
        pureLogic: true,
        flowsAndStartup: true,
        paintedGeometry: true,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    it('VALID: reviewerMarkdown => rejects on sight the eight hand-waves that shipped on this repo', () => {
      expect({
        coverageFirst: reviewerMarkdown.includes('## Coverage first'),
        coverageIsMechanical: reviewerMarkdown.includes('That check is\nmechanical.'),
        missingIdsGoBack: reviewerMarkdown.includes('Missing ids are not a judgement call.'),
        adjectives: reviewerMarkdown.includes('**Adjectives where values belong.**'),
        cannotComeOutDifferently: reviewerMarkdown.includes(
          '**A measurement incapable of coming out differently.**',
        ),
        suiteInsteadOfWalk: reviewerMarkdown.includes(
          '**A suite run offered in place of a walk.**',
        ),
        simplifiedCanvas: reviewerMarkdown.includes('**A canvas the worker simplified.**'),
        canvasIsDefinedWhereItIsUsed: reviewerMarkdown.includes(
          'The canvas is the seeded data the plan handed it.',
        ),
        requestFired: reviewerMarkdown.includes(
          '**A `custom` unit reduced to "a request fired".**',
        ),
        nonDomInTheDom: reviewerMarkdown.includes('**A non-DOM unit checked in the DOM.**'),
        hiddenTab: reviewerMarkdown.includes(
          '**A geometry or visibility finding from a hidden tab.**',
        ),
        fixedWithNoRedTest: reviewerMarkdown.includes(
          '**A fix the worker reports with no red test.**',
        ),
      }).toStrictEqual({
        coverageFirst: true,
        coverageIsMechanical: true,
        missingIdsGoBack: true,
        adjectives: true,
        cannotComeOutDifferently: true,
        suiteInsteadOfWalk: true,
        simplifiedCanvas: true,
        canvasIsDefinedWhereItIsUsed: true,
        requestFired: true,
        nonDomInTheDom: true,
        hiddenTab: true,
        fixedWithNoRedTest: true,
      });
    });

    // Worker N's claimed fix is only real if the reviewer can read it in the tree. The block
    // therefore says what to do when it is not there, rather than leaving the reviewer to infer it.
    it('VALID: reviewerMarkdown => sends an unfindable repair back as rework', () => {
      expect({
        readTheDiff: reviewerMarkdown.includes(
          'in the diff. Read `git diff` or `git show` on the file it named.',
        ),
        notInTheTree: reviewerMarkdown.includes(
          '**If the change is not in the\ntree, worker N never made the repair.** Return `NEXT: rework`.',
        ),
      }).toStrictEqual({ readTheDiff: true, notInTheTree: true });
    });

    it('VALID: reviewerMarkdown => writes siegemasterSignoff, batched, in a two-verdict vocabulary', () => {
      expect({
        theTrack: reviewerMarkdown.includes('One `siegemasterSignoff` per unit'),
        confirmed: reviewerMarkdown.includes(
          '| `confirmed` | a worker measured it off the running system.',
        ),
        unconfirmable: reviewerMarkdown.includes(
          '| `unconfirmable` | no surface settles it after real effort.',
        ),
        bothClear: reviewerMarkdown.includes('Both verdicts CLEAR a unit'),
        batch: reviewerMarkdown.includes('**BATCH the writes: ONE `modify-quest` call**'),
        idPlusFieldOnly: reviewerMarkdown.includes(
          'A signing element carries ONLY its `id` plus the sign-off field.',
        ),
        offMapIdIsTheFamily: reviewerMarkdown.includes(
          "An `offMapSignoffs` entry's `id` IS the probe family.",
        ),
        noteNeverClosesAUnit: reviewerMarkdown.includes(
          '**A `questNotes` entry NEVER closes a unit. Only a sign-off closes one.**',
        ),
        measuredDefectIsAdded: reviewerMarkdown.includes(
          'is an observable the round MEASURED into existence',
        ),
        addedBy: reviewerMarkdown.includes("`addedBy: 'siegemaster'`"),
      }).toStrictEqual({
        theTrack: true,
        confirmed: true,
        unconfirmable: true,
        bothClear: true,
        batch: true,
        idPlusFieldOnly: true,
        offMapIdIsTheFamily: true,
        noteNeverClosesAUnit: true,
        measuredDefectIsAdded: true,
        addedBy: true,
      });
    });

    // Both sibling packs carry this rule. This pack needs it MORE than either. `siegemaster` is
    // the last role on the quest, so an unaudited deferral is final. A `pt N` session that never
    // pulled `reset-flow-signoffs` inherits its predecessor's `unconfirmable` entries intact.
    it('VALID: reviewerMarkdown => audits every unconfirmable a predecessor left behind', () => {
      expect({
        auditEveryOne: reviewerMarkdown.includes(
          "**AUDIT EVERY `unconfirmable`, a predecessor's included.**",
        ),
        deferralHidesThere: reviewerMarkdown.includes(
          'An `unconfirmable` closes a unit\npermanently while sounding responsible, so a session defers behind it.',
        ),
        assignmentRatherThanWall: reviewerMarkdown.includes(
          'Reopen any whose evidence\nnames an assignment rather than a wall.',
        ),
        youOwnWhatYouReopen: reviewerMarkdown.includes('You own every unit you reopen.'),
        lastRoleOnTheQuest: reviewerMarkdown.includes(
          '**Your role is the LAST one\non this quest**',
        ),
        ptNInheritsThem: reviewerMarkdown.includes(
          "A `pt N` session inherits its predecessor's\n`unconfirmable` entries intact unless your parent pulled `reset-flow-signoffs`.",
        ),
        theLeverWentUnpulled: reviewerMarkdown.includes(
          'Prior parents\npulled that lever ZERO times in 334 audited turns.',
        ),
      }).toStrictEqual({
        auditEveryOne: true,
        deferralHidesThere: true,
        assignmentRatherThanWall: true,
        youOwnWhatYouReopen: true,
        lastRoleOnTheQuest: true,
        ptNInheritsThem: true,
        theLeverWentUnpulled: true,
      });
    });

    // A change here invalidates the clean walks the round just produced. The audit is therefore
    // MUTATION-ONLY. A suspected defect routes to a fresh walk rather than a fix in place.
    it('VALID: reviewerMarkdown => runs a mutation-only audit and routes a suspected defect to rework', () => {
      expect({
        heading: reviewerMarkdown.includes('## The mutation audit'),
        breakTheLine: reviewerMarkdown.includes('1. Break the production line.'),
        runThatOneFile: reviewerMarkdown.includes('2. Run that ONE test file.'),
        watchItFail: reviewerMarkdown.includes('3. Watch whether the test fails.'),
        revertByEditing: reviewerMarkdown.includes(
          '4. Revert BY EDITING the line back, never with `git checkout --`.',
        ),
        diffIsEmpty: reviewerMarkdown.includes("5. Confirm that file's diff is empty."),
        mutationOnly: reviewerMarkdown.includes('It is **MUTATION-ONLY**'),
        wouldInvalidateTheWalks: reviewerMarkdown.includes(
          'a change you make here invalidates the clean walks this\nround just produced.',
        ),
        suspectedDefectIsRework: reviewerMarkdown.includes(
          'A suspected defect is `NEXT: rework` for a fresh walk, never fixed here.',
        ),
        banIsOnProductBehaviour: reviewerMarkdown.includes(
          '**That ban is on PRODUCT BEHAVIOUR UNDER WALK. It binds nothing else.**',
        ),
        emptySetFallback: reviewerMarkdown.includes(
          "audit the tests that COVER the flow's units instead",
        ),
      }).toStrictEqual({
        heading: true,
        breakTheLine: true,
        runThatOneFile: true,
        watchItFail: true,
        revertByEditing: true,
        diffIsEmpty: true,
        mutationOnly: true,
        wouldInvalidateTheWalks: true,
        suspectedDefectIsRework: true,
        banIsOnProductBehaviour: true,
        emptySetFallback: true,
      });
    });

    // CROSS-FILE PAIR — `reviewerMinionStatics`' "What is not yours" ward entry ←→ this pack's
    // mutation audit. That entry BANS a second round-scoped ward and, inside the same bullet,
    // EXEMPTS a run over ONE file or ONE test and a revert-to-see-whether-a-test-fails, then defers
    // to whatever the discipline requires as proof. This audit is made of exactly those runs: break
    // one production line, run that ONE test file, revert by editing. It asks for no round-scoped
    // ward of its own, which is why `--staged` must not appear in this block at all.
    //
    // What breaks if they diverge: the reviewer reads its own template as forbidding the only run
    // this audit consists of. It skips the audit — and on the LAST role of the quest, a test
    // incapable of failing then clears the final gate with nobody behind it to notice.
    it('VALID: the mutation audit => asks only for runs the reviewer template exempts from its ward ban', () => {
      expect({
        templateSendsTheRoundsWardToTheParent:
          REVIEWER_TEMPLATE_NOT_YOURS.includes("**The round's ward.**"),
        templateExemptsAOneFileOrOneTestRun: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          '**A run over ONE file or ONE test is not on this list.**',
        ),
        templatePermitsARevertToSeeATestFail: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          '- you revert a line to see whether a test fails;',
        ),
        templateDefersToTheDiscipline: REVIEWER_TEMPLATE_NOT_YOURS.includes(
          'Your discipline above may require one as proof.',
        ),
        packBreaksOneProductionLine: reviewerMarkdown.includes('1. Break the production line.'),
        packRunsOneTestFile: reviewerMarkdown.includes('2. Run that ONE test file.'),
        packRevertsByEditingRatherThanCheckout: reviewerMarkdown.includes(
          '4. Revert BY EDITING the line back, never with `git checkout --`.',
        ),
        packAsksForARoundScopedWardOfItsOwn: reviewerMarkdown.includes('--staged'),
      }).toStrictEqual({
        templateSendsTheRoundsWardToTheParent: true,
        templateExemptsAOneFileOrOneTestRun: true,
        templatePermitsARevertToSeeATestFail: true,
        templateDefersToTheDiscipline: true,
        packBreaksOneProductionLine: true,
        packRunsOneTestFile: true,
        packRevertsByEditingRatherThanCheckout: true,
        packAsksForARoundScopedWardOfItsOwn: false,
      });
    });

    // `standardsReviewConcernsStatics` is embedded in EVERY reviewer prompt. It tells this same
    // session "where a case is missing and you can write it, write it". An unqualified "author no
    // tests" reaches the reader first. That turns the concern into a `gap` on the last round that
    // could pay it.
    it('VALID: reviewerMarkdown => scopes the no-tests ban to the walk and leaves test-cases with the reviewer', () => {
      expect({
        scopedInline: reviewerMarkdown.includes('Author no test FOR THE WALK'),
        stillCarriesTheUnqualifiedBan: reviewerMarkdown.includes('Author no tests,'),
        whyItIsAnotherLane: reviewerMarkdown.includes(
          "because proving a walked behaviour is another\nrole's lane.",
        ),
        testCasesStaysYours: reviewerMarkdown.includes(
          'That ban does not reach the `test-cases` concern',
        ),
        theCarveOutParagraphRemains: reviewerMarkdown.includes(
          "The standing concerns' own\nin-file fixes stay yours and stay `fixed`",
        ),
        neverRecordItAGap: reviewerMarkdown.includes(
          '**Never record a\n`test-cases` unit `gap` on the strength of the mutation-audit ban.**',
        ),
        lastRoundThatCouldWriteIt: reviewerMarkdown.includes(
          'This is the last round that\ncould write that case.',
        ),
      }).toStrictEqual({
        scopedInline: true,
        stillCarriesTheUnqualifiedBan: false,
        whyItIsAnotherLane: true,
        testCasesStaysYours: true,
        theCarveOutParagraphRemains: true,
        neverRecordItAGap: true,
        lastRoundThatCouldWriteIt: true,
      });
    });

    // Two roles read the fetch-intercept rule and reached opposite verdicts on six units. The ban
    // binds AUTHORED specs. A hand-driven measurement is how this discipline works.
    it("VALID: reviewerMarkdown => resolves the fetch-intercept rule in this discipline's favour", () => {
      expect({
        bindsAuthoredSpecs: reviewerMarkdown.includes(
          'The fetch-intercept ban binds **AUTHORED specs**',
        ),
        handDrivenMayPatch: reviewerMarkdown.includes(
          '**A hand-driven MEASUREMENT in a live browser MAY patch the fetch boundary to force a\nvalue.**',
        ),
        namesTheLever: reviewerMarkdown.includes('The resulting sign-off names the lever.'),
        thisDisciplinesOwnModality: reviewerMarkdown.includes(
          'A hand-driven measurement is how this discipline\nworks, so it is permitted here.',
        ),
        sixUnitsStand: reviewerMarkdown.includes('The six units it was contested over stand.'),
      }).toStrictEqual({
        bindsAuthoredSpecs: true,
        handDrivenMayPatch: true,
        namesTheLever: true,
        thisDisciplinesOwnModality: true,
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
