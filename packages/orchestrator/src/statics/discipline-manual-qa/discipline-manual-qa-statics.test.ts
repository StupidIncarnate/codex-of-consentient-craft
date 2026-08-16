import { operationOrchestratorPromptStatics } from '../operation-orchestrator-prompt/operation-orchestrator-prompt-statics';
import { disciplineManualQaStatics } from './discipline-manual-qa-statics';

const has = ({ text, needle }: { text: string; needle: string }): boolean => text.includes(needle);

const { orchestratorMarkdown, plannerMarkdown, workerMarkdown, reviewerMarkdown } =
  disciplineManualQaStatics;

// The orchestrator template's whole design is a session whose context CANNOT fill up: it loads no
// standards and runs no search. A pack that names one of these hands the tool back through the one
// slot the template cannot police, and the session that reads source stops dispatching mid-loop.
const TOOLS_THE_ORCHESTRATOR_NEVER_LOADS = [
  'get-architecture',
  'get-syntax-rules',
  'get-testing-patterns',
  'discover',
  'get-project-map',
  'get-project-inventory',
  'get-folder-detail',
] as const;

// `$DISCIPLINE` is served inside the template, whose own budget is measured separately. These two
// numbers are what keep the composed prompt under the MCP verbatim-delivery ceiling.
const ORCHESTRATOR_BUDGET_CHARS = 2_500;
const MINION_BLOCK_BUDGET_CHARS = 6_500;

const MINION_BLOCKS = [
  ['plannerMarkdown', plannerMarkdown],
  ['workerMarkdown', workerMarkdown],
  ['reviewerMarkdown', reviewerMarkdown],
] as const;

const ALL_BLOCKS = [['orchestratorMarkdown', orchestratorMarkdown], ...MINION_BLOCKS] as const;

// The five standing concerns live in `standardsReviewConcernsStatics`, already embedded in the
// reviewer template beside `$DISCIPLINE`. A pack-local copy is a copy that drifts.
const SHARED_STANDARDS_REVIEW_MARKERS = [
  'craft',
  'dedup',
  'integrity',
  'test-cases',
  'blightLedger',
  'get-blight-checklist',
] as const;

describe('disciplineManualQaStatics', () => {
  it('VALID: exported value => exactly the four discipline blocks, each a non-empty string', () => {
    expect(disciplineManualQaStatics).toStrictEqual({
      orchestratorMarkdown: expect.stringMatching(/^.+$/su),
      plannerMarkdown: expect.stringMatching(/^.+$/su),
      workerMarkdown: expect.stringMatching(/^.+$/su),
      reviewerMarkdown: expect.stringMatching(/^.+$/su),
    });
  });

  describe('budgets', () => {
    it('VALID: orchestratorMarkdown => stays within the orchestrator budget', () => {
      expect(orchestratorMarkdown.length).toBeLessThanOrEqual(ORCHESTRATOR_BUDGET_CHARS);
    });

    it.each(MINION_BLOCKS)(
      'VALID: {block: %s} => stays within the minion budget',
      (name, markdown) => {
        expect({ name, withinBudget: markdown.length <= MINION_BLOCK_BUDGET_CHARS }).toStrictEqual({
          name,
          withinBudget: true,
        });
      },
    );
  });

  describe('the orchestrator block hands back no tool the template took away', () => {
    it.each(TOOLS_THE_ORCHESTRATOR_NEVER_LOADS)(
      'VALID: {tool: %s} => is absent from orchestratorMarkdown',
      (tool) => {
        expect(has({ text: orchestratorMarkdown, needle: tool })).toBe(false);
      },
    );

    // Drift guard the other way: each name above is a tool the template's FORBIDDEN block really
    // names, so this list cannot quietly become a list of strings nobody forbids.
    it.each(TOOLS_THE_ORCHESTRATOR_NEVER_LOADS)(
      'VALID: {tool: %s} => is named in the orchestrator template FORBIDDEN block',
      (tool) => {
        const { template } = operationOrchestratorPromptStatics.prompt;
        const forbiddenBlock = template.slice(
          template.indexOf('FORBIDDEN — no exceptions'),
          template.indexOf('judging whether code is CORRECT'),
        );

        expect(has({ text: forbiddenBlock, needle: tool })).toBe(true);
      },
    );

    it('VALID: orchestratorMarkdown => leaves the signal shapes to the template', () => {
      expect(has({ text: orchestratorMarkdown, needle: 'signal-back' })).toBe(false);
    });
  });

  // The pack owns SCOPE and METHOD; the templates own the LOOP. Restating the build/ward gates here
  // is how a pack starts contradicting the loop it was interpolated into.
  it.each(ALL_BLOCKS)(
    'VALID: {block: %s} => restates neither the build nor the ward gate',
    (name, markdown) => {
      expect({
        name,
        build: has({ text: markdown, needle: 'npm run build' }),
        ward: has({ text: markdown, needle: 'npm run ward' }),
      }).toStrictEqual({ name, build: false, ward: false });
    },
  );

  it.each(SHARED_STANDARDS_REVIEW_MARKERS)(
    'VALID: {concern marker: %s} => is absent from reviewerMarkdown, which defers to the shared statics',
    (marker) => {
      expect(has({ text: reviewerMarkdown, needle: marker })).toBe(false);
    },
  );

  describe('orchestratorMarkdown', () => {
    it('VALID: block => scopes the item to ONE FLOW and names the checklist as the denominator', () => {
      expect({
        oneFlow: has({ text: orchestratorMarkdown, needle: '**Your item is ONE FLOW.**' }),
        denominatorCall: has({
          text: orchestratorMarkdown,
          needle: "`get-qa-checklist({ questId, flowId, track: 'siegemaster' })`",
        }),
        neverEnumerateByHand: has({
          text: orchestratorMarkdown,
          needle: 'the tool cannot skip a long tail',
        }),
        pathsVsUnits: has({
          text: orchestratorMarkdown,
          needle:
            '**Paths are the ITINERARY; units are the DEFINITION OF DONE — not the same size.**',
        }),
        twentyObservablesOnOneNode: has({
          text: orchestratorMarkdown,
          needle: 'carry twenty observables stacked on one node',
        }),
        zeroUnitsIsReal: has({ text: orchestratorMarkdown, needle: 'Zero units is a real state' }),
      }).toStrictEqual({
        oneFlow: true,
        denominatorCall: true,
        neverEnumerateByHand: true,
        pathsVsUnits: true,
        twentyObservablesOnOneNode: true,
        zeroUnitsIsReal: true,
      });
    });

    it('VALID: block => claims the last behaviour fix, security, performance and observation', () => {
      expect({
        lastRoleFixingBehaviour: has({
          text: orchestratorMarkdown,
          needle: '**You are the LAST role that fixes BEHAVIOUR**',
        }),
        nothingRunsAfterYou: has({
          text: orchestratorMarkdown,
          needle: 'nothing after you runs the system',
        }),
        securityAndPerf: has({
          text: orchestratorMarkdown,
          needle: '**Security and performance are YOURS**',
        }),
        perfIsMeasuredOffTheRunningSystem: has({
          text: orchestratorMarkdown,
          needle: '`perf` MEASURES its performance off the running system',
        }),
        observationNotInspection: has({
          text: orchestratorMarkdown,
          needle: '**Verification means OBSERVATION**',
        }),
        aSuiteIsAClaim: has({ text: orchestratorMarkdown, needle: 'a green suite is a claim' }),
        notEveryFlowHasAUi: has({
          text: orchestratorMarkdown,
          needle: '**Not every flow has a UI**',
        }),
      }).toStrictEqual({
        lastRoleFixingBehaviour: true,
        nothingRunsAfterYou: true,
        securityAndPerf: true,
        perfIsMeasuredOffTheRunningSystem: true,
        observationNotInspection: true,
        aSuiteIsAClaim: true,
        notEveryFlowHasAUi: true,
      });
    });

    it('VALID: block => owns one dev server, kills it scoped, and treats a dead one as a defect', () => {
      expect({
        serverIsYours: has({
          text: orchestratorMarkdown,
          needle: '**The dev server is yours alone**',
        }),
        contextCarriesTheCommandAndUrl: has({
          text: orchestratorMarkdown,
          needle: '`Dev Server Command` / `Dev Server URL`',
        }),
        scopedKill: has({
          text: orchestratorMarkdown,
          needle: "match port AND cwd, or use the repo's scoped kill script",
        }),
        noBarePkill: has({ text: orchestratorMarkdown, needle: 'never `pkill` a bare' }),
        deadServerIsADefect: has({
          text: orchestratorMarkdown,
          needle: '**A server that will not start is your first defect, not a wall.**',
        }),
        driversAreSerial: has({
          text: orchestratorMarkdown,
          needle: '**Every driving worker is SERIAL, always**',
        }),
        onlyInspectionRunsBeside: has({
          text: orchestratorMarkdown,
          needle: 'Only pure inspection runs beside a driver.',
        }),
      }).toStrictEqual({
        serverIsYours: true,
        contextCarriesTheCommandAndUrl: true,
        scopedKill: true,
        noBarePkill: true,
        deadServerIsADefect: true,
        driversAreSerial: true,
        onlyInspectionRunsBeside: true,
      });
    });

    it('VALID: block => routes a measured defect to an added observable and a free track reset', () => {
      expect({
        defectIsAnObservable: has({
          text: orchestratorMarkdown,
          needle: '**A defect you MEASURE is a NEW observable, not a verdict.**',
        }),
        addedBySiegemaster: has({
          text: orchestratorMarkdown,
          needle: "(`addedBy: 'siegemaster'`)",
        }),
        noThirdVerdict: has({
          text: orchestratorMarkdown,
          needle: 'No `gap`/`recorded`/`deferred`',
        }),
        resetCall: has({
          text: orchestratorMarkdown,
          needle: '`reset-flow-signoffs({ questId, workItemId, flowId, reason })`',
        }),
        resetsAreFree: has({
          text: orchestratorMarkdown,
          needle: '**Resets are FREE — no pt-chain attempt, no admission of failure**',
        }),
        theMeasuredCostOfNotResetting: has({
          text: orchestratorMarkdown,
          needle: '334 audited turns, while 52 units sat signed against pre-fix code',
        }),
        emptyCommitStillLands: has({ text: orchestratorMarkdown, needle: '(`--allow-empty`)' }),
      }).toStrictEqual({
        defectIsAnObservable: true,
        addedBySiegemaster: true,
        noThirdVerdict: true,
        resetCall: true,
        resetsAreFree: true,
        theMeasuredCostOfNotResetting: true,
        emptyCommitStillLands: true,
      });
    });
  });

  describe('plannerMarkdown', () => {
    it('VALID: block => cuts small slices and designs the lever and the canvas the worker cannot', () => {
      expect({
        errSmall: has({
          text: plannerMarkdown,
          needle:
            '**Err small: a worker that reports on eight units carefully beats one that skims thirty.**',
        }),
        leverProvenTwice: has({
          text: plannerMarkdown,
          needle: '**1. The seed/reset lever — prove it by using it TWICE.**',
        }),
        falseFindingAndFalseGreen: has({
          text: plannerMarkdown,
          needle:
            'is a FALSE finding; a branch that passes only because prior state masked the bug is a FALSE green.',
        }),
        discriminatingCanvas: has({
          text: plannerMarkdown,
          needle: "**2. A DISCRIMINATING canvas — never inherit the e2e suite's fixture.**",
        }),
        hostileMembers: has({
          text: plannerMarkdown,
          needle: 'an unbroken token with no break opportunity',
        }),
        faultLever: has({ text: plannerMarkdown, needle: '**3. A fault lever.**' }),
        unforceableIsUnconfirmable: has({
          text: plannerMarkdown,
          needle: 'A unit that cannot be forced is signed `unconfirmable`',
        }),
      }).toStrictEqual({
        errSmall: true,
        leverProvenTwice: true,
        falseFindingAndFalseGreen: true,
        discriminatingCanvas: true,
        hostileMembers: true,
        faultLever: true,
        unforceableIsUnconfirmable: true,
      });
    });

    it('VALID: block => settles the browser surface before any browser slice is planned', () => {
      expect({
        establishTheSurface: has({
          text: plannerMarkdown,
          needle: '**4. Establish the real browser surface before planning any browser slice.**',
        }),
        theAsymmetricDenial: has({
          text: plannerMarkdown,
          needle: '`navigate` returns `Permission denied by user`',
        }),
        theWorkingFallback: has({ text: plannerMarkdown, needle: '**Playwright Node API**' }),
        degradedIsDeclared: has({ text: plannerMarkdown, needle: 'the run is DEGRADED' }),
        noBrowserIsNotAnExcuse: has({
          text: plannerMarkdown,
          needle: 'as a way to skip the harder walk.**',
        }),
      }).toStrictEqual({
        establishTheSurface: true,
        theAsymmetricDenial: true,
        theWorkingFallback: true,
        degradedIsDeclared: true,
        noBrowserIsNotAnExcuse: true,
      });
    });

    it('VALID: block => hands every worker the four environment facts that each cost a session', () => {
      expect({
        ipv6Only: has({ text: plannerMarkdown, needle: '**The dev server binds IPv6-only**' }),
        offlineDoesNotCloseTheSocket: has({
          text: plannerMarkdown,
          needle:
            '**`context.setOffline(true)` does NOT close an established WebSocket in Chromium**',
        }),
        barrelBootsTimers: has({
          text: plannerMarkdown,
          needle: '**Importing the orchestrator barrel boots real intervals and fs watchers**',
        }),
        noHeredocsOrUnboundedLoops: has({
          text: plannerMarkdown,
          needle: 'rejects `python3` heredocs and unbounded shell loops',
        }),
        theBoundedPoll: has({
          text: plannerMarkdown,
          needle: '`curl -sf --retry 15 --retry-delay 2 --retry-connrefused`',
        }),
      }).toStrictEqual({
        ipv6Only: true,
        offlineDoesNotCloseTheSocket: true,
        barrelBootsTimers: true,
        noHeredocsOrUnboundedLoops: true,
        theBoundedPoll: true,
      });
    });
  });

  describe('workerMarkdown', () => {
    // The independence the whole pipeline is shaped around: the session that made a repair is never
    // the session that grades it, which only holds if the broken state is recorded BEFORE the fix.
    it('VALID: block => stops at the first defect, records the break first, and never grades its own fix', () => {
      expect({
        stopAtFirstDefect: has({ text: workerMarkdown, needle: '## STOP at the first defect' }),
        recordBrokenStateFirst: has({
          text: workerMarkdown,
          needle: '**Record its BROKEN state BEFORE you fix it**',
        }),
        reviewerReDrives: has({
          text: workerMarkdown,
          needle: 'Your reviewer verifies by RE-DRIVING',
        }),
        fixRedFirst: has({ text: workerMarkdown, needle: '**Fix it red-first.**' }),
        neverContinuePastYourRepair: has({
          text: workerMarkdown,
          needle: '**Never continue past your own repair, and never grade it.**',
        }),
        aFreshWorkerVerifies: has({
          text: workerMarkdown,
          needle: 'A FRESH worker re-walks this slice',
        }),
      }).toStrictEqual({
        stopAtFirstDefect: true,
        recordBrokenStateFirst: true,
        reviewerReDrives: true,
        fixRedFirst: true,
        neverContinuePastYourRepair: true,
        aFreshWorkerVerifies: true,
      });
    });

    it('VALID: block => fixes the per-unit evidence a report must carry', () => {
      expect({
        precondition: has({
          text: workerMarkdown,
          needle:
            'PRECONDITION: <the state I reset to, and that I ran the reset lever to get there>',
        }),
        whatItDid: has({
          text: workerMarkdown,
          needle:
            'DID:          <my actions in order — URL loaded, elements clicked, payload sent, command run>',
        }),
        aValueNeverAnAdjective: has({
          text: workerMarkdown,
          needle: 'A value, never an adjective',
        }),
        brokenWouldShow: has({
          text: workerMarkdown,
          needle: 'BROKEN WOULD SHOW: <the specific different value a defect would have produced>',
        }),
        resetBeforeEveryPath: has({ text: workerMarkdown, needle: '**Reset before EVERY path**' }),
        forceEveryBranch: has({
          text: workerMarkdown,
          needle: '**Force every branch and reach every terminal.**',
        }),
        checkUnitsWhereTheyLive: has({
          text: workerMarkdown,
          needle: '**Check each unit where it actually lives.**',
        }),
      }).toStrictEqual({
        precondition: true,
        whatItDid: true,
        aValueNeverAnAdjective: true,
        brokenWouldShow: true,
        resetBeforeEveryPath: true,
        forceEveryBranch: true,
        checkUnitsWhereTheyLive: true,
      });
    });

    it('VALID: block => accepts a clean walk and withholds git and the dev server', () => {
      expect({
        zeroDefectsIsGood: has({
          text: workerMarkdown,
          needle: '**ZERO DEFECTS IS A GOOD ANSWER.**',
        }),
        noManufacturedFinding: has({
          text: workerMarkdown,
          needle: 'Do not manufacture a finding to look productive.',
        }),
        neverGit: has({
          text: workerMarkdown,
          needle: '- **`git`, ever.** Your parent owns the commit.',
        }),
        neverBounceTheServer: has({
          text: workerMarkdown,
          needle: "never run the reset lever's owning server",
        }),
      }).toStrictEqual({
        zeroDefectsIsGood: true,
        noManufacturedFinding: true,
        neverGit: true,
        neverBounceTheServer: true,
      });
    });
  });

  describe('reviewerMarkdown', () => {
    it('VALID: block => judges artifacts as claims and checks coverage mechanically first', () => {
      expect({
        artifactIsAClaim: has({ text: reviewerMarkdown, needle: 'Judge each artifact as a CLAIM' }),
        coverageFirst: has({
          text: reviewerMarkdown,
          needle: '## Coverage first, and it is mechanical',
        }),
        everyUnitIdMustAppear: has({
          text: reviewerMarkdown,
          needle: "Every unit id in the slice must appear in that worker's report.",
        }),
        crossCheckTheDiff: has({
          text: reviewerMarkdown,
          needle: 'read `git diff` on the file it named',
        }),
        aRepairNobodyCanFind: has({
          text: reviewerMarkdown,
          needle: '**A repair nobody can find in the working tree did not happen.**',
        }),
      }).toStrictEqual({
        artifactIsAClaim: true,
        coverageFirst: true,
        everyUnitIdMustAppear: true,
        crossCheckTheDiff: true,
        aRepairNobodyCanFind: true,
      });
    });

    // Each of these is a hand-wave that shipped on this repo. Dropping one drops the only place a
    // reviewer is told that shape is not evidence.
    it('VALID: block => carries all eight reject-on-sight shapes', () => {
      expect({
        adjectives: has({ text: reviewerMarkdown, needle: '**Adjectives where values belong.**' }),
        unfalsifiableMeasurement: has({
          text: reviewerMarkdown,
          needle: '**A measurement incapable of coming out differently.**',
        }),
        suiteInsteadOfWalk: has({
          text: reviewerMarkdown,
          needle: '**A suite run offered in place of a walk.**',
        }),
        theNinetySixSecondAudit: has({ text: reviewerMarkdown, needle: '96-second suite audit' }),
        simplifiedCanvas: has({
          text: reviewerMarkdown,
          needle: '**A canvas the worker simplified.**',
        }),
        customUnitReducedToARequest: has({
          text: reviewerMarkdown,
          needle: '**A `custom` unit reduced to "a request fired".**',
        }),
        nonDomUnitInTheDom: has({
          text: reviewerMarkdown,
          needle: '**A non-DOM unit checked in the DOM.**',
        }),
        hiddenTabGeometry: has({
          text: reviewerMarkdown,
          needle: '**A geometry or visibility finding from a hidden tab.**',
        }),
        fixWithNoRedTest: has({
          text: reviewerMarkdown,
          needle: '**A defect reported as fixed with no red test.**',
        }),
      }).toStrictEqual({
        adjectives: true,
        unfalsifiableMeasurement: true,
        suiteInsteadOfWalk: true,
        theNinetySixSecondAudit: true,
        simplifiedCanvas: true,
        customUnitReducedToARequest: true,
        nonDomUnitInTheDom: true,
        hiddenTabGeometry: true,
        fixWithNoRedTest: true,
      });
    });

    it('VALID: block => writes batched two-verdict sign-offs and refuses questNotes as a closer', () => {
      expect({
        confirmedRow: has({
          text: reviewerMarkdown,
          needle: '| `confirmed` | measured off the running system',
        }),
        unconfirmableNeedsAQuestion: has({
          text: reviewerMarkdown,
          needle: 'a `question` naming what someone else would need is REQUIRED',
        }),
        batchedWrites: has({
          text: reviewerMarkdown,
          needle: '**BATCH the writes: ONE `modify-quest` call per artifact**',
        }),
        offMapIdIsTheFamily: has({
          text: reviewerMarkdown,
          needle: "offMapSignoffs: [{ id: 'hostile-input', siegemasterSignoff: { ... } }]",
        }),
        notesNeverClose: has({
          text: reviewerMarkdown,
          needle: '**A `questNotes` entry NEVER closes a unit; only a sign-off does.**',
        }),
        // The server stamps the time; a value an LLM invents is fabricated audit data.
        noTimestampField: has({ text: reviewerMarkdown, needle: 'at:' }),
      }).toStrictEqual({
        confirmedRow: true,
        unconfirmableNeedsAQuestion: true,
        batchedWrites: true,
        offMapIdIsTheFamily: true,
        notesNeverClose: true,
        noTimestampField: false,
      });
    });

    it('VALID: block => scopes the mutation audit so a clean walk cannot empty it', () => {
      expect({
        mutationOnly: has({ text: reviewerMarkdown, needle: 'It is **MUTATION-ONLY**' }),
        changesNoBehaviour: has({ text: reviewerMarkdown, needle: 'change no behaviour' }),
        theEmptySetFix: has({
          text: reviewerMarkdown,
          needle: 'when that set is EMPTY on a clean',
        }),
        auditTheCoveringTests: has({
          text: reviewerMarkdown,
          needle: "audit the tests that COVER the flow's units instead",
        }),
        theOverrideThatPaidOff: has({
          text: reviewerMarkdown,
          needle: "the run's only coverage finding",
        }),
      }).toStrictEqual({
        mutationOnly: true,
        changesNoBehaviour: true,
        theEmptySetFix: true,
        auditTheCoveringTests: true,
        theOverrideThatPaidOff: true,
      });
    });

    it('VALID: block => resolves the fetch-intercept ban as binding authored specs only', () => {
      expect({
        bindsAuthoredSpecs: has({
          text: reviewerMarkdown,
          needle: 'The fetch-intercept ban binds **AUTHORED specs**',
        }),
        handDrivenMeasurementMayPatch: has({
          text: reviewerMarkdown,
          needle: 'MAY patch the fetch boundary',
        }),
        theContestedUnitsStand: has({
          text: reviewerMarkdown,
          needle: 'the six units it was contested over stand',
        }),
      }).toStrictEqual({
        bindsAuthoredSpecs: true,
        handDrivenMeasurementMayPatch: true,
        theContestedUnitsStand: true,
      });
    });
  });
});
