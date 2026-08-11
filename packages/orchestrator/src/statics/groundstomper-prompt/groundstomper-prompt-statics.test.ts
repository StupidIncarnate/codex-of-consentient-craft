import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { groundstomperPromptStatics } from './groundstomper-prompt-statics';

const has = (needle: string): boolean =>
  groundstomperPromptStatics.prompt.template.includes(needle);

describe('groundstomperPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(groundstomperPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    const { template } = groundstomperPromptStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Operation Context$/mu.test(template),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true });
  });

  it('VALID: title => frames Groundstomper as the browser walk operator', () => {
    expect(groundstomperPromptStatics.prompt.template).toMatch(
      /^# Groundstomper - Browser Walk Operator$/mu,
    );
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    expect(has(agentOperatingRulesStatics.markdown)).toBe(true);
  });

  // It signs the track, so it needs the verdict vocabulary, the evidence bar and the false-green
  // catalogue verbatim — a change to the shared block cannot land on one side only.
  it('VALID: template => embeds the shared judging criteria verbatim', () => {
    expect(has(flowEvidenceContractStatics.judgingMarkdown)).toBe(true);
  });

  // The authoring block's whole subject is choosing a layer per observable. This role's layer is
  // fixed at the browser, so carrying it would hand a session a decision it does not get to make.
  it('VALID: template => does NOT carry the layer-choosing authoring block', () => {
    expect(has(flowEvidenceContractStatics.authoringMarkdown)).toBe(false);
  });

  it('VALID: template => scopes the item to ONE runtime flow’s browser walk', () => {
    expect({
      ownsOneItem: has("You own ONE operation item on the quest's operations ledger"),
      coversOneFlow: has("that item covers **ONE runtime\nflow's browser walk**"),
      contextNamesTheFlow: has('Your Operation Context names the flow.'),
      playwrightOnly: has('Your output is Playwright, and only\nPlaywright'),
    }).toStrictEqual({
      ownsOneItem: true,
      coversOneFlow: true,
      contextNamesTheFlow: true,
      playwrightOnly: true,
    });
  });

  it('VALID: template => summons no minions and says why the walk does not fan out', () => {
    expect({
      worksAlone: has('**You work alone.** You summon no minions.'),
      namesTheReason: has(
        'A browser walk is one path at a time against one served\napp, so there is nothing here to fan out',
      ),
      authorIsTheWitness: has(
        'the session that\nauthors the walk is the one that watched it go red',
      ),
      noDelegationProtocol: !has('Delegation Protocol'),
    }).toStrictEqual({
      worksAlone: true,
      namesTheReason: true,
      authorIsTheWitness: true,
      noDelegationProtocol: true,
    });
  });

  // THE gate this role exists for: one flow is routinely already covered by several specs, so the
  // job is usually to extend one. A session that authors first stands a parallel suite beside it and
  // the run is green either way.
  it('VALID: Gate 1 => is the e2e inventory, resolving packages then listing then reading then deciding', () => {
    expect({
      gateHeading:
        /^### Gate 1: Inventory the Existing e2e Suite for THIS Flow \(BLOCKING, do this FIRST\)$/mu.test(
          groundstomperPromptStatics.prompt.template,
        ),
      resolvesFromPackagesAffected: has(
        '**Resolve the e2e-eligible packages from `packagesAffected`.**',
      ),
      resolvesByPackageType: has(
        'The e2e-eligible ones are exactly\n   those whose `packageType` is a browser-reachable kind',
      ),
      isASet: has(
        'Treat the answer as a SET — a repo may have several UI packages, and it may have none.',
      ),
      neverAssumesAPath: has('**Never assume a package path.**'),
      listsEveryE2eFile: has('**List every `.e2e.ts` file in those packages**'),
      readsByEntryRoute: has("**Read the ones whose entry route matches THIS flow's entry node.**"),
      matchesOnPageGoto: has("a spec's `page.goto` target names the route it starts at"),
      neverCreditsAFilename: has('**Do not credit a file by its\n   name**'),
      decidesPerUnit: has('**Decide extend-vs-add PER UNIT, not per flow.**'),
      threeVerdicts: has('record ONE of three verdicts: **already covered**'),
      namesBothWrongAnswers: has(
        'A whole flow\n   marked "add" while three specs already walk its entry route is a wrong answer — and so is a whole\n   flow marked "extend" into a spec that asserts something unrelated.',
      ),
    }).toStrictEqual({
      gateHeading: true,
      resolvesFromPackagesAffected: true,
      resolvesByPackageType: true,
      isASet: true,
      neverAssumesAPath: true,
      listsEveryE2eFile: true,
      readsByEntryRoute: true,
      matchesOnPageGoto: true,
      neverCreditsAFilename: true,
      decidesPerUnit: true,
      threeVerdicts: true,
      namesBothWrongAnswers: true,
    });
  });

  it('VALID: template => makes the empty resolved-package set a real state rather than an error', () => {
    expect({
      emptySetIsSeededInError: has(
        'If the set is empty, this item was seeded in error: say so\n   plainly, skip to Gate 5, and signal `done`.',
      ),
    }).toStrictEqual({ emptySetIsSeededInError: true });
  });

  it('VALID: template => takes the browser-reachable units as its denominator and hands the rest on', () => {
    expect({
      denominatorIsTagged: has(
        '**Yours is the subset whose owning node is\ntagged with a package you resolved in Gate 1.**',
      ),
      flowriderOwnsTheRest: has(
        'The rest belong to Flowrider, measured over the\npackage kinds a browser cannot reach, and to Siegemaster, measured over all of them.',
      ),
      partitionIsExact: has('the two authoring denominators partition the package kinds\nexactly'),
      offMapIsSiegemasters: has("are Siegemaster's charter"),
      hostileInputStaysMine: has('a benign-input monoculture in your specs is a hole on YOUR side'),
      operationalNeverSeedsAnItem: has('no groundstomper item is ever seeded for one'),
      remainingIsTheGateCount: has('**Work it to zero across\nthe units in your denominator.**'),
    }).toStrictEqual({
      denominatorIsTagged: true,
      flowriderOwnsTheRest: true,
      partitionIsExact: true,
      offMapIsSiegemasters: true,
      hostileInputStaysMine: true,
      operationalNeverSeedsAnItem: true,
      remainingIsTheGateCount: true,
    });
  });

  // The checklist call has to name the DENOMINATOR track, which is the role, not the sign-off field
  // this role writes. A track-less call falls back to the flow-wide qaLedger difference — a number
  // nobody's gate computes — and naming `flowrider` returns the package kinds this role is measured
  // over the complement of, so it would read zero while its own gate refused.
  it('VALID: template => scopes both get-qa-checklist calls to its OWN track, and says why the other name is wrong', () => {
    expect({
      gate1Call: has("get-qa-checklist({ questId, flowId, track: 'groundstomper' })` for the flow"),
      gate1CarriesTheSlice: has('pass `packageNames` too if your Operation Context declares any'),
      wrongTrackIsTheComplement: has(
        'Naming `flowrider` there returns the units\n   in the package kinds you are NOT measured over',
      ),
      recheckCall: has(
        "Then re-call `get-qa-checklist({ questId, flowId, track: 'groundstomper' })` and\ndiff against Gate 1's ids.",
      ),
      recheckIsTheGateNumber: has(
        'On your own track `remainingItemIds` IS the number the completion gate\nwill refuse `done` on',
      ),
    }).toStrictEqual({
      gate1Call: true,
      gate1CarriesTheSlice: true,
      wrongTrackIsTheComplement: true,
      recheckCall: true,
      recheckIsTheGateNumber: true,
    });
  });

  // The colocation rule must never name a real package: this system runs in other repos, and a repo
  // may have several UI packages or none.
  it('VALID: template => states the colocation rule against a resolved-package placeholder', () => {
    expect({
      exclusive: has('**e2e = Playwright exclusively'),
      placeholderPath: has('<e2e-package>/src/flows/<route>/<feature>.e2e.ts'),
      placeholderIsResolved: has('is a package you RESOLVED in Gate 1, never a path you assumed'),
      startsIsWhereItLives: has('Where the test STARTS is where it\nlives'),
      nonPlaywrightIsFlowriders: has(
        'named\nintegration (`.integration.test.ts`) and belongs to Flowrider, not to you',
      ),
    }).toStrictEqual({
      exclusive: true,
      placeholderPath: true,
      placeholderIsResolved: true,
      startsIsWhereItLives: true,
      nonPlaywrightIsFlowriders: true,
    });
  });

  it('VALID: template => hardcodes no UI package path and carries no .spec.ts references', () => {
    const { template } = groundstomperPromptStatics.prompt;

    expect({
      uiPackage: template.indexOf('packages/web'),
      specTs: template.indexOf('.spec.ts'),
    }).toStrictEqual({ uiPackage: -1, specTs: -1 });
  });

  it('VALID: template => takes no dev server and refuses to author a Playwright webServer block', () => {
    expect({
      neverTouchesOne: has('**You never touch a dev server, and you are not given one.**'),
      playwrightConfigOwnsIt: has(
        "The server an e2e run needs is declared\nin the project's Playwright config (`webServer`)",
      ),
      testsAreBaseUrlRelative: has('your tests navigate `baseURL`-relative'),
      siegemasterOwnsIt: has("Standing a long-lived\nserver up by hand is Siegemaster's job"),
      missingWebServerIsUnconfirmable: has(
        'sign every unit it blocks\n`unconfirmable`, with the missing piece as the evidence and the question',
      ),
      neverAuthorsIt: has('You do not author a\n`webServer` block'),
      namesTheSiblingRace: has('the\nsibling groundstomper items work against this same tree'),
    }).toStrictEqual({
      neverTouchesOne: true,
      playwrightConfigOwnsIt: true,
      testsAreBaseUrlRelative: true,
      siegemasterOwnsIt: true,
      missingWebServerIsUnconfirmable: true,
      neverAuthorsIt: true,
      namesTheSiblingRace: true,
    });
  });

  it('VALID: template => authors one test per path red-first and drives mutations through the UI', () => {
    expect({
      onePerPath: has('**One test per path** from the entry node to EVERY terminal you own'),
      everyBranch: has('cover ALL branches, success and failure'),
      namesTheHappyPathFailure: has(
        '"I covered the happy path and stopped" is the most\n  common way this role fails',
      ),
      fullTransition: has('**Assert the full transition.**'),
      twoOfAnything: has('**Two of anything an assertion must discriminate.**'),
      drivesThroughTheUi: has('**Drive state through the UI, not around it.**'),
      preconditionsMayBeSeeded: has(
        'Seeding a PRECONDITION through the server or the\n  file system is fine',
      ),
      neverSleeps: has('**Wait for elements, never for a duration.**'),
      redFirst: has(
        '**Watch each new case fail before you make it pass, and capture the failure output.**',
      ),
      mutationFallback: has('confirm `git diff` on that file is empty'),
    }).toStrictEqual({
      onePerPath: true,
      everyBranch: true,
      namesTheHappyPathFailure: true,
      fullTransition: true,
      twoOfAnything: true,
      drivesThroughTheUi: true,
      preconditionsMayBeSeeded: true,
      neverSleeps: true,
      redFirst: true,
      mutationFallback: true,
    });
  });

  // An e2e + harness file set has no Jest counterpart, so this role hits DISCOVERY MISMATCH nearly
  // every run — which is why the guidance lives here rather than with Flowrider.
  it('VALID: template => narrows ward for a file set with no Jest counterpart', () => {
    expect({
      almostEveryRun: has(
        '**You will hit the narrowing case almost every run, because your file set has no Jest counterpart.**',
      ),
      namesTheSymptom: has('ward reports `DISCOVERY MISMATCH`'),
      notADefect: has('"this check had nothing to do here", not "your code is broken"'),
      givesTheInvocation: has('`--only lint,typecheck,e2e -- <files>`'),
      neverPassWithNoTests: has('Never reach\nfor `--passWithNoTests`'),
      scopedInvocation: has('npm run ward -- -- <the files changed>'),
      detail: has('`npm run ward -- detail <runId>`'),
    }).toStrictEqual({
      almostEveryRun: true,
      namesTheSymptom: true,
      notADefect: true,
      givesTheInvocation: true,
      neverPassWithNoTests: true,
      scopedInvocation: true,
      detail: true,
    });
  });

  it('VALID: template => writes the flowrider track over kinds disjoint from Flowrider’s', () => {
    expect({
      writesTheSameField: has('carries a `flowriderSignoff`'),
      fieldIsTheTrack: has('That\nfield is the TRACK'),
      disjointKinds: has('Flowrider and you write it over DISJOINT\npackage kinds'),
      neitherSettlesTheOther: has(
        'so signing one of yours never settles one of its units, and vice versa',
      ),
      sameEvidenceBar: has('**Sign to the same bar Flowrider is held to:**'),
      batched: has('BATCH the writes — ONE `modify-quest` call carrying\nmany sign-offs'),
      reconcilesById: has("diff against Gate 1's ids"),
    }).toStrictEqual({
      writesTheSameField: true,
      fieldIsTheTrack: true,
      disjointKinds: true,
      neitherSettlesTheOther: true,
      sameEvidenceBar: true,
      batched: true,
      reconcilesById: true,
    });
  });

  it('VALID: template => signs an unclosable unit unconfirmable instead of pt-chaining it', () => {
    expect({
      signedNotChained: has(
        '**A unit you genuinely cannot close is signed `unconfirmable` — it is NOT a reason to signal\n`partial`.**',
      ),
      namesTheChainCost: has(
        'burns the chain to\n`maxAttempts` on sessions that provably cannot close it, and then blocks the quest',
      ),
      partialIsForRealRemainder: has('`partial` is\nfor scope a fresh session really could finish'),
      auditsPredecessors: has("**AUDIT EVERY `unconfirmable`, a predecessor's included.**"),
    }).toStrictEqual({
      signedNotChained: true,
      namesTheChainCost: true,
      partialIsForRealRemainder: true,
      auditsPredecessors: true,
    });
  });

  it('VALID: template => grants a bounded implementation-fix authority and forbids config edits', () => {
    expect({
      section: /^## Your Authority — What You May Change$/mu.test(
        groundstomperPromptStatics.prompt.template,
      ),
      mayChangeImplementation: has('**You MAY change implementation, and often you should.**'),
      redFirst: has('**fix it, red test first**'),
      doNotRebuild: has('**Close the hole; do not rebuild the feature.**'),
      neverBend: has('**Never bend the implementation to make a test pass**'),
      neverEditsTheConfig: has(
        "**Never edit the Playwright config, and never edit a harness another flow's session owns.**",
      ),
      lastWriteWins: has('an edit there is\n  last-write-wins'),
      fixesGoInTheCommit: has('Every change you make beyond a test goes in your commit message'),
    }).toStrictEqual({
      section: true,
      mayChangeImplementation: true,
      redFirst: true,
      doNotRebuild: true,
      neverBend: true,
      neverEditsTheConfig: true,
      lastWriteWins: true,
      fixesGoInTheCommit: true,
    });
  });

  it('VALID: template => keeps the commit as the only handoff channel and forbids stashing', () => {
    expect({
      onlyChannel: has('**The commit message is the ONLY handoff channel'),
      recordsTheInventory: has(
        'the Gate 1 inventory — every spec you opened and\nthe extend-vs-add verdict per unit',
      ),
      recordsWardChecks: has('which ward checks you ran and why'),
      noStash: has('**Hard rule — DO NOT STASH.**'),
      signalsDone: has('Signal `done` when Gate 6 passes'),
      partialOnlyRemainder: has('Signal `partial` **only when real scope remains**'),
    }).toStrictEqual({
      onlyChannel: true,
      recordsTheInventory: true,
      recordsWardChecks: true,
      noStash: true,
      signalsDone: true,
      partialOnlyRemainder: true,
    });
  });

  it('VALID: template => closes with numbered rules ending on the signal-back outcome', () => {
    const { template } = groundstomperPromptStatics.prompt;

    expect({
      rules: /^## Rules$/mu.test(template),
      inventoryFirst: has('1. **Inventory before you author**'),
      extendNotDuplicate: has('2. **Extend, do not duplicate**'),
      playwrightOnly: has('3. **Playwright only**'),
      oneFlowNoMinions: has('4. **One flow, no minions**'),
      denominatorByKind: has('5. **Your denominator is the browser-reachable units**'),
      trackMustBeWritten: has(
        '12. **The track must be written** — every unit you own signed `confirmed` or `unconfirmable`, and\n    the outcome rides on signal-back as done|partial',
      ),
    }).toStrictEqual({
      rules: true,
      inventoryFirst: true,
      extendNotDuplicate: true,
      playwrightOnly: true,
      oneFlowNoMinions: true,
      denominatorByKind: true,
      trackMustBeWritten: true,
    });
  });
});
