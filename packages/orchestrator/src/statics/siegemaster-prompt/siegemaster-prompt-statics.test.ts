import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

const has = (needle: string): boolean => siegemasterPromptStatics.prompt.template.includes(needle);

describe('siegemasterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line under the Operation Context heading', () => {
    const { template } = siegemasterPromptStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Operation Context$/mu.test(template),
      underTheHeading: has('## Operation Context\n\n$ARGUMENTS'),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true, underTheHeading: true });
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    expect(has(agentOperatingRulesStatics.markdown)).toBe(true);
  });

  it('VALID: template => titles the role a manual QA operator', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^# Siegemaster - Manual QA Operator$/mu,
    );
  });

  it('VALID: template => frames the role as an operator accountable for EVERY flow on the quest', () => {
    expect({
      ownsOneItem: has('You own ONE operation item on the quest'),
      coversEveryFlow: has('and that item covers **EVERY flow on\nthis quest**'),
      notAssignedOne: has('You are not assigned a flow'),
      includingSeams: has('accountable for all of them, and for the seams\nbetween them.'),
    }).toStrictEqual({
      ownsOneItem: true,
      coversEveryFlow: true,
      notAssignedOne: true,
      includingSeams: true,
    });
  });

  it('VALID: template => delegates the walking and keeps verification of minion reports as the core job', () => {
    expect({
      groupsAndDispatches: has(
        '**group the flows into walk-bundles, stand up the one dev\nserver, dispatch a `siegemaster-minion` per bundle, then verify what came back**',
      ),
      verificationIsTheJob: has('The verification\nis the job.'),
      whyRoleExists: has('that proves nothing, and catching that is why this role exists.'),
    }).toStrictEqual({
      groupsAndDispatches: true,
      verificationIsTheJob: true,
      whyRoleExists: true,
    });
  });

  it('VALID: template => declares it the last role that fixes behaviour, after a Flowrider that also fixed', () => {
    expect({
      lastFixer: has('**You are the LAST role that fixes BEHAVIOUR.**'),
      flowriderAlsoFixes: has(
        'Flowrider before you closes the holes its own testing\nexposes, so some are already fixed',
      ),
      inboundIsArchitectural: has(
        'anything architectural, anything needing a product decision,\nand anything its tests could not reach was left as a red test plus a `GAP:` addressed to you',
      ),
      reviewersNeverRun: has('they never run the system.'),
      otherwiseItShips: has('If a behaviour\nis broken and you do not fix it, it ships.'),
    }).toStrictEqual({
      lastFixer: true,
      flowriderAlsoFixes: true,
      inboundIsArchitectural: true,
      reviewersNeverRun: true,
      otherwiseItShips: true,
    });
  });

  it('VALID: template => grants the widest fix authority and makes delegation optional', () => {
    expect({
      section: /^## Your Authority — What You May Change$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      widestAuthority: has('**You have the widest fix authority on this quest.**'),
      nobodyAfterRunsIt: has(
        'Nobody after you runs the system, so a defect you leave is a defect that ships.',
      ),
      delegationOptional: has('**Delegation is your default, not an obligation.**'),
      mayWorkInline: has('Fix a one-line defect the moment you confirm it.'),
      doNotRebuild: has('**Close the hole; do not rebuild the feature.**'),
      neverRevertOthers: has("**Never delete or revert another session's committed work.**"),
      neverBendImplementation: has('never bend the implementation to make a\n  test pass'),
      snowballIsNotAWall: has('**A fix that snowballs is not a wall.**'),
      productDecisionRouted: has('**A product decision is not yours to make.**'),
      minionsAreTheException: has('**Your minions are the exception, and deliberately so.**'),
    }).toStrictEqual({
      section: true,
      widestAuthority: true,
      nobodyAfterRunsIt: true,
      delegationOptional: true,
      mayWorkInline: true,
      doNotRebuild: true,
      neverRevertOthers: true,
      neverBendImplementation: true,
      snowballIsNotAWall: true,
      productDecisionRouted: true,
      minionsAreTheException: true,
    });
  });

  it('VALID: template => demands observation over inspection and refuses a green suite as evidence', () => {
    expect({
      observation: has('**Verification means OBSERVATION, not inspection.**'),
      suiteIsAClaim: has(
        'A green test suite is a claim about the system, not an observation of it.',
      ),
    }).toStrictEqual({ observation: true, suiteIsAClaim: true });
  });

  // A clean walk being a success is enforced in three places that DO work — the Gate 7 rejection
  // criterion, the rule, and the minion brief — rather than restated as intro prose.
  it('VALID: template => makes a clean walk a success everywhere it is enforced', () => {
    expect({
      rejectionCriterion: has('- **The formulaic single finding.**'),
      signatureNotCoincidence: has(
        'Exactly one finding per bundle, per pass, every pass, is a\n  signature and not a coincidence.',
      ),
      zeroBeatsManufactured: has(
        '**A report of zero defects backed by a complete walk record is worth\n  more than one finding backed by nothing, and you should say so when you accept it.**',
      ),
      rule: has('8. **A clean walk is a success**'),
      briefTellsTheMinion: has(
        'ZERO DEFECTS IS A GOOD ANSWER. Do not manufacture a finding to look productive.',
      ),
    }).toStrictEqual({
      rejectionCriterion: true,
      signatureNotCoincidence: true,
      zeroBeatsManufactured: true,
      rule: true,
      briefTellsTheMinion: true,
    });
  });

  it('VALID: template => walks a non-UI flow at whatever surface it really has', () => {
    expect(has('**Not every quest has a UI.**')).toBe(true);
  });

  it('VALID: template => forbids editing the operations ledger', () => {
    expect(has('**You do NOT edit the operations ledger.**')).toBe(true);
  });

  it('VALID: template => has an authority section putting observation and git first and the minion report last', () => {
    expect({
      section: /^## What Is Authoritative/mu.test(siegemasterPromptStatics.prompt.template),
      observedCounts: has('1. **Only what was OBSERVED counts.**'),
      flowGraphIsTarget: has('2. **The flow graph is the acceptance target.**'),
      gitIsState: has('3. **Git is the state.**'),
      reportIsAClaim: has('walk report is a claim, not evidence.**'),
      lastLine: has('5. **Your own judgement is the last line.**'),
    }).toStrictEqual({
      section: true,
      observedCounts: true,
      flowGraphIsTarget: true,
      gitIsState: true,
      reportIsAClaim: true,
      lastLine: true,
    });
  });

  it('VALID: template => allows exactly ONE dev server because a repo devCommand may refuse a port override', () => {
    expect({
      section: /^## System Exclusivity — ONE Server, ONE Driver \(do not "optimise" this\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      arbitraryRepos: has('Dungeonmaster runs inside arbitrary user repos'),
      noPortOverride: has('You may NOT assume it accepts a port\noverride'),
      maybeSingleton: has('it may hardcode its port or be a\nsingleton by construction'),
      oneOrigin: has('There is exactly one server and exactly one origin.'),
      notAnOversight: has('This is a correctness constraint, not a performance oversight.'),
    }).toStrictEqual({
      section: true,
      arbitraryRepos: true,
      noPortOverride: true,
      maybeSingleton: true,
      oneOrigin: true,
      notAnOversight: true,
    });
  });

  it('VALID: template => serialises EVERY driving bundle and parallelises only mutate-nothing work', () => {
    expect({
      laneSplitIsMutation: has('the split is **mutating vs read-only** — NOT\nbrowser vs backend'),
      strictlySerial: has(
        '**The DRIVING lane is STRICTLY SERIAL — one minion at a time, whatever surface it drives.**',
      ),
      namesEveryDrivingSurface: has(
        'A\n  browser walk, a `curl` walk, a CLI run, a queue produce, a sweep',
      ),
      backendIsNotSafeBesideBrowser: has(
        'A\n  backend bundle is NOT safe to run beside a browser bundle just because it never opens a tab',
      ),
      readOnlyLaneMutatesNothing: has('**The READ-ONLY lane parallelises freely**'),
      readOnlyNeverRunsLever: has('MUTATES NOTHING and never runs the lever'),
      defaultsToSerial: has(
        'If you are unsure which lane a bundle belongs to, it is the driving lane.',
      ),
      oneAtATimeInGate: has(
        '- **Every DRIVING bundle: one at a time — browser, `curl`, CLI, queue, sweep alike.**',
      ),
      readOnlyParallelInGate: has('- **READ-ONLY work: parallel.**'),
    }).toStrictEqual({
      laneSplitIsMutation: true,
      strictlySerial: true,
      namesEveryDrivingSurface: true,
      backendIsNotSafeBesideBrowser: true,
      readOnlyLaneMutatesNothing: true,
      readOnlyNeverRunsLever: true,
      defaultsToSerial: true,
      oneAtATimeInGate: true,
      readOnlyParallelInGate: true,
    });
  });

  it('VALID: template => runs the reset lever itself between driving bundles', () => {
    expect({
      operatorRunsLeverBetween: has(
        'Between bundles, run the reset lever YOURSELF and confirm the\n  canvas is back before the next minion starts.',
      ),
      leverIsNotDelegable: has(
        "the lever especially, because a minion\n  that owns the lever owns everyone else's preconditions",
      ),
      exitCriteriaProvesSerialisation: has(
        'with every\ndriving bundle provably serialised and the lever run by you between them',
      ),
    }).toStrictEqual({
      operatorRunsLeverBetween: true,
      leverIsNotDelegable: true,
      exitCriteriaProvesSerialisation: true,
    });
  });

  it('VALID: template => makes the operator, not a minion, own the server, the reset lever, and the canvas', () => {
    expect({
      operatorStarts: has('**You** start the dev server, once'),
      notDelegable: has('All three are operator work and cannot be delegated'),
      operatorTearsDown: has('**You tear the server down** before you signal'),
      gate: has(
        '### Gate 5: Stand Up the Real System ONCE & Author the Canvas (BLOCKING — yours alone)',
      ),
      startsTheOneServer: has('1. **Start the one dev server.**'),
      authorsTheLever: has(
        '**Author the seed/reset lever, once, and prove it works by using it twice.**',
      ),
      minionMustNotStartOne: has(
        'DEV SERVER URL: <the already-running URL — do NOT start, restart, or stop a server>',
      ),
    }).toStrictEqual({
      operatorStarts: true,
      notDelegable: true,
      operatorTearsDown: true,
      gate: true,
      startsTheOneServer: true,
      authorsTheLever: true,
      minionMustNotStartOne: true,
    });
  });

  it('VALID: template => requires a discriminating canvas with two of everything plus a hostile member', () => {
    expect({
      neverInherit: has('4. **Design a DISCRIMINATING canvas — never inherit the e2e suite'),
      twoOfEverything: has('**At least two of anything an assertion must tell apart**'),
      oneHostileMember: has('**At least one hostile or extreme member per input class**'),
      benignCannotFail: has('A canvas of short space-separated happy strings cannot fail.'),
      everyPrecondition: has('**The precondition every path in your Gate 3 map needs**'),
    }).toStrictEqual({
      neverInherit: true,
      twoOfEverything: true,
      oneHostileMember: true,
      benignCannotFail: true,
      everyPrecondition: true,
    });
  });

  it('VALID: template => runs ten gates, each sequential with exactly one exit criterion', () => {
    const { template } = siegemasterPromptStatics.prompt;

    expect({
      section: /^## Gates$/mu.test(template),
      sequential: has('Gates are sequential. Each has exit criteria. Do not skip.'),
      gateHeadings: template.split('\n### Gate ').length - 1,
      exitCriteria: template.split('**Exit Criteria:**').length - 1,
    }).toStrictEqual({ section: true, sequential: true, gateHeadings: 10, exitCriteria: 10 });
  });

  it('VALID: template => loads all three standards tools as a blocking first gate', () => {
    expect({
      blocking: has('### Gate 1: Load Project Standards (MCP — BLOCKING, do this FIRST)'),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
    }).toStrictEqual({ blocking: true, architecture: true, syntax: true, testing: true });
  });

  it('VALID: template => trusts git over the ledger and treats every inbound GAP as its own work', () => {
    expect({
      gate: has('### Gate 2: Verify Against Git & Collect Your Inbound GAPs (BLOCKING)'),
      trustGit: has('**Trust git over the ledger.**'),
      gapsAreYours: has('**`GAP:` — these are addressed to YOU, and they are inbound work.**'),
      ontoTheFixList: has('Every `GAP:` goes straight onto your Gate 9 fix list'),
      adjustedIsReviewed: has('Each is a REVIEW TARGET,'),
      couldNotVersusChoseNot: has('"chose not to" are different, and only the first is allowed'),
      addedIsWalked: has('- **`ADDED:`** — a tightened target.'),
      ptMeansPriorSession: has(
        'A `pt N:` prefix on your operation item means a prior session of your role ran.',
      ),
    }).toStrictEqual({
      gate: true,
      trustGit: true,
      gapsAreYours: true,
      ontoTheFixList: true,
      adjustedIsReviewed: true,
      couldNotVersusChoseNot: true,
      addedIsWalked: true,
      ptMeansPriorSession: true,
    });
  });

  it('VALID: template => reads every flow as it stands now and treats custom as a behavioural invariant', () => {
    expect({
      gate: has('### Gate 3: Read Every Flow, Map Every Terminal'),
      customIsInvariant: has('**`custom` is a behavioural invariant, not an I/O channel**'),
      // No "as authored" version of the spec exists: quest.json is overwritten in place, has no
      // history field, and lives in a gitignored dir. The ADJUSTED:/ADDED: prose Gate 2 reads out of
      // commit bodies is the only drift record, so Gate 3 must not imply a comparison is available.
      noAuthoredBaseline: has('not as they were authored'),
      driftMarkersReadAtGate2: has(
        '**`ADJUSTED:`** — an observable a prior session could not meet',
      ),
    }).toStrictEqual({
      gate: true,
      customIsInvariant: true,
      noAuthoredBaseline: false,
      driftMarkersReadAtGate2: true,
    });
  });

  it('VALID: template => bundles flows by precondition, surface, coupling, and modality', () => {
    expect({
      gate: has('### Gate 4: Group the Flows into Walk-Bundles (BLOCKING — plan up front)'),
      precondition: has('- **Shared precondition / seed state.**'),
      surface: has('- **Shared surface or route.**'),
      coupled: has('- **Coupled behaviour.**'),
      modality: has('- **Same modality.**'),
      splitBig: has('- **Split anything too big to hold.**'),
    }).toStrictEqual({
      gate: true,
      precondition: true,
      surface: true,
      coupled: true,
      modality: true,
      splitBig: true,
    });
  });

  it('VALID: template => orders minion evidence before any minion fix', () => {
    expect({
      gate: has('### Gate 6: Dispatch Minions — Every Walk STRICTLY SERIAL'),
      evidenceFirst: has('**Evidence comes before any fix**'),
      brokenStateCaptured: has('**A walk report must capture the broken state first**'),
      reasonIsReDriving: has(
        'a defect\n  already fixed can no longer be re-driven in its broken state',
      ),
      drivingMayFixSmall: has(
        '**Having captured that, a `DRIVING`-lane minion MAY close a small, local hole**',
      ),
      reportsBothStates: has('reports both the before and the after'),
      biggerIsReported: has('**Anything bigger is reported, not taken**'),
      readOnlyChangesNothing: has('**A `READ-ONLY`-lane minion changes NO files at all**'),
      reloadIsTheReason: has(
        'The dev server\n  reloads on a source edit, which would derail the driving minion',
      ),
      noMinionGit: has('**No minion runs `git`.**'),
    }).toStrictEqual({
      gate: true,
      evidenceFirst: true,
      brokenStateCaptured: true,
      reasonIsReDriving: true,
      drivingMayFixSmall: true,
      reportsBothStates: true,
      biggerIsReported: true,
      readOnlyChangesNothing: true,
      reloadIsTheReason: true,
      noMinionGit: true,
    });
  });

  it('VALID: template => hands the minion a lane-aware FIX AUTHORITY line in the brief', () => {
    expect({
      briefLine: has('FIX AUTHORITY: <DRIVING lane: Measure the broken state FIRST'),
      namesSmallHoles: has('wrong string, missing guard, off-by-one, unhandled branch'),
      reportsArchitectural: has(
        'Report rather than take anything architectural,\n  anything spanning bundles, or anything needing a product decision.',
      ),
      readOnlyEditsNothing: has('READ-ONLY lane: change NO files\n  at all'),
      neverGit: has('never run\n  `git`, I own the commit'),
      zeroDefectsIsGood: has('ZERO DEFECTS IS A GOOD ANSWER.'),
    }).toStrictEqual({
      briefLine: true,
      namesSmallHoles: true,
      reportsArchitectural: true,
      readOnlyEditsNothing: true,
      neverGit: true,
      zeroDefectsIsGood: true,
    });
  });

  it('VALID: template => defines a five-part evidence contract whose third and fourth items are the value and the failure mode', () => {
    expect({
      gate: has(
        '### Gate 7: Verify Every Walk Report — Reject Hand-Waving (THIS IS YOUR CORE JOB)',
      ),
      contract: has('**The evidence contract.**'),
      allFive: has('give you all five:'),
      verbatimId: has('the flow id and the **terminal or observable id with its verbatim text**'),
      whatItDid: has('**what the minion DID**'),
      measuredValue: has('the **measured value it read back**'),
      notAnAdjective: has('A value, not an adjective.'),
      failureMode: has('**what a broken system would have shown instead**'),
      precondition: has('the **precondition it started from**'),
      threeAndFourKillIt: has('Items 3 and 4 are where reports die.'),
    }).toStrictEqual({
      gate: true,
      contract: true,
      allFive: true,
      verbatimId: true,
      whatItDid: true,
      measuredValue: true,
      notAnAdjective: true,
      failureMode: true,
      precondition: true,
      threeAndFourKillIt: true,
    });
  });

  it('VALID: template => rejects adjectives, unfalsifiable measurements, suite runs, and the formulaic single finding', () => {
    expect({
      header: has(
        '**Reject and re-dispatch on any of these. Each is a hand-wave that shipped on this repo:**',
      ),
      adjectives: has('- **Adjectives where values belong.**'),
      unfalsifiable: has('- **A measurement incapable of coming out differently.**'),
      fixedByConstruction: has('A measurement whose result is fixed by'),
      suiteInsteadOfWalk: has('- **The suite run offered in place of a walk.**'),
      neverTestAuthoring: has('**Never accept test authoring in place of a walk.**'),
      formulaic: has('- **The formulaic single finding.**'),
      everyPassIsASignature: has('Exactly one finding per bundle, per pass, every pass, is a'),
      zeroBeatsOne: has('**A report of zero defects backed by a complete walk record is worth'),
    }).toStrictEqual({
      header: true,
      adjectives: true,
      unfalsifiable: true,
      fixedByConstruction: true,
      suiteInsteadOfWalk: true,
      neverTestAuthoring: true,
      formulaic: true,
      everyPassIsASignature: true,
      zeroBeatsOne: true,
    });
  });

  it('VALID: template => rejects unreached terminals, undamaged-unchecked sad paths, DOM-checked non-DOM observables, and a simplified canvas', () => {
    expect({
      terminals: has('- **Terminals not reached.**'),
      sadPathDamage: has('- **Sad paths not checked for damage.**'),
      nonDom: has('- **Non-DOM observables checked in the DOM.**'),
      customReduced: has('- **`custom` observables reduced to "a request fired".**'),
      simplifiedCanvas: has('- **A canvas the minion simplified.**'),
      offMapSkipped: has('- **Off-map families skipped silently.**'),
    }).toStrictEqual({
      terminals: true,
      sadPathDamage: true,
      nonDom: true,
      customReduced: true,
      simplifiedCanvas: true,
      offMapSkipped: true,
    });
  });

  it('VALID: template => rejects a geometry or visibility finding measured from a hidden tab', () => {
    expect({
      criterion: has('- **A geometry or visibility finding from a hidden tab.**'),
      hiddenState: has('`visibilityState: "hidden"`'),
      throttlesRaf: has('which throttles `requestAnimationFrame`'),
      clicksFallThrough: has('nodes read as invisible with zero-ish boxes and clicks fall through'),
      screenshotClearsIt: has('A screenshot forces a frame and clears it.'),
    }).toStrictEqual({
      criterion: true,
      hiddenState: true,
      throttlesRaf: true,
      clicksFallThrough: true,
      screenshotClearsIt: true,
    });
  });

  it('VALID: template => spot-checks by hand, verifies by mutation, and allows one re-dispatch per bundle', () => {
    expect({
      spotCheck: has('**Spot-check by hand.**'),
      mutate: has('**verify by mutation**'),
      revert: has('confirm `git diff` on\nthat file is empty'),
      pivot: has('**Pivot rule.**'),
      onceThenInline: has(
        'One re-dispatch per bundle with a sharper brief naming exactly which criterion it\nfailed.',
      ),
      noArtifactStillWalked: has('there is no partial credit for a bundle nobody drove'),
    }).toStrictEqual({
      spotCheck: true,
      mutate: true,
      revert: true,
      pivot: true,
      onceThenInline: true,
      noArtifactStillWalked: true,
    });
  });

  it('VALID: template => gates on a whole-quest due-diligence ledger with one disposition each', () => {
    expect({
      gate: has(
        '### Gate 8: The Whole-Quest Due-Diligence Ledger (gate — do not signal until this passes)',
      ),
      notASummary: has('Not a\nsummary — the actual list.'),
      oneEach: has('Every entry gets exactly ONE disposition:'),
      walked: has('`WALKED`'),
      fixed: has('`FIXED`'),
      routed: has('`ROUTED`'),
      recorded: has('`RECORDED`'),
      gap: has('`GAP:`'),
      unconfirmed: has('`UNCONFIRMED`'),
    }).toStrictEqual({
      gate: true,
      notASummary: true,
      oneEach: true,
      walked: true,
      fixed: true,
      routed: true,
      recorded: true,
      gap: true,
      unconfirmed: true,
    });
  });

  it('VALID: template => requires a named owner on RECORDED and refuses a gap as a way to dispose of unwalked work', () => {
    expect({
      namedOwner: has('a defect not closed this session, with a **named owner** and the reason.'),
      ownerlessIsNotADisposition: has('with no owner is not a disposition.'),
      gapIsNotAnExcuse: has(
        'it is **not** a way to dispose of something you simply did not get to.',
      ),
    }).toStrictEqual({
      namedOwner: true,
      ownerlessIsNotADisposition: true,
      gapIsNotAnExcuse: true,
    });
  });

  it('VALID: template => gives every deferred defect a destination, routing product decisions to the user', () => {
    expect({
      needsDestination: has('**Deferral needs a DESTINATION — this is the expensive bug.**'),
      fixItYourself: has(
        '- **Fixable and in your scope → fix it** (Gate 9). It being your job is not a reason to defer it.',
      ),
      askTheUser: has(
        '- **Real, user-visible, needs a product decision → `ask-user-question`, in this session.**',
      ),
      recordedWithOwner: has(
        '- **Genuinely out of reach → `RECORDED` with a named owner**, in the ledger AND the commit.',
      ),
      proseGetsLost: has('A real defect recorded only in prose'),
      instead: has('`ask-user-question` rather than burying it in a commit message.'),
    }).toStrictEqual({
      needsDestination: true,
      fixItYourself: true,
      askTheUser: true,
      recordedWithOwner: true,
      proseGetsLost: true,
      instead: true,
    });
  });

  it('VALID: template => checks the cross-flow seams no single bundle can see', () => {
    expect({
      bothClaim: has('an observable **two flows both claim** from opposite sides'),
      mutualDeferral: has(
        'an observable each side deferred to the other, so it is verified nowhere',
      ),
      noObservables: has('a node carrying **no observables at all** — that is a spec hole.'),
      twinSurface: has('**twin surface**'),
      additiveOnly: has('ADDITIVE-ONLY'),
      movingTheSpec: has('**Moving the spec.**'),
    }).toStrictEqual({
      bothClaim: true,
      mutualDeferral: true,
      noObservables: true,
      twinSurface: true,
      additiveOnly: true,
      movingTheSpec: true,
    });
  });

  it('VALID: template => fixes red-first at an observing layer and makes a ripple search mandatory on every fix', () => {
    expect({
      gate: has('### Gate 9: TDD-Fix What Survived, Red-First'),
      redFirst: has(
        '1. **Failing test FIRST**, in a modality that can actually observe the defect.',
      ),
      jsdomIsBlind: has('**jsdom has no layout engine and every measured width reads'),
      neverBendATest: has('a test bent to fit broken behaviour certifies the break'),
      rippleMandatory: has('3. **RIPPLE SEARCH — mandatory on every fix, no exceptions.**'),
      everyOtherPlace: has('find **every other place that same value renders'),
      halfAFix: has('A fix without a ripple list is half a fix.'),
      reWalkByHand: has('4. **Re-walk the fixed path by hand.**'),
      backIntoTheSpec: has('**Put an off-map finding back into the spec**'),
    }).toStrictEqual({
      gate: true,
      redFirst: true,
      jsdomIsBlind: true,
      neverBendATest: true,
      rippleMandatory: true,
      everyOtherPlace: true,
      halfAFix: true,
      reWalkByHand: true,
      backIntoTheSpec: true,
    });
  });

  it('VALID: template => builds before ward as its own unpiped command and keeps ward scoped', () => {
    expect({
      gate: has(
        '### Gate 10: Ward, Teardown, Commit, Signal (BLOCKING — do not end your turn before this)',
      ),
      buildFirst: has('`npm run build` FIRST, as its own command'),
      neverPipe: has('never pipe it'),
      staleDist: has('piping discards the exit code and a stale `dist` produces phantom failures'),
      noCdNoPoll: has('Never `cd` into a package. Never sleep-poll a background run.'),
      detail: has('`npm run ward -- detail <runId>`'),
      discoveredIsNotRan: has('a "discovered" file count is not a count of tests that ran'),
      scopedInvocation: has('npm run ward -- -- <the files changed>'),
      noRedundantOnly: !has('--only lint,typecheck,unit,integration,e2e'),
      explainsTheDefault: has(
        'omitting the flag\nalready runs all five checks (lint, typecheck, unit, integration, e2e)',
      ),
    }).toStrictEqual({
      gate: true,
      buildFirst: true,
      neverPipe: true,
      staleDist: true,
      noCdNoPoll: true,
      detail: true,
      discoveredIsNotRan: true,
      scopedInvocation: true,
      noRedundantOnly: true,
      explainsTheDefault: true,
    });
  });

  it('VALID: template => tears the dev server down with a port, cwd, and mode scoped kill', () => {
    expect({
      teardown: has('**Teardown.** Stop the dev server you started in Gate 5'),
      scopedByThree: has('the port, the cwd, and the mode you launched'),
      neverBlanket: has('Use a scoped kill, never a blanket one'),
      matchesPortAndCwdTogether: has('match on the port AND the cwd together'),
      neverBarePkill: has('Never `pkill` on a bare process name\nor port alone'),
    }).toStrictEqual({
      teardown: true,
      scopedByThree: true,
      neverBlanket: true,
      matchesPortAndCwdTogether: true,
      neverBarePkill: true,
    });
  });

  it('VALID: template => treats a repo dev:kill script as discovered, not assumed to exist', () => {
    expect({
      conditional: has('If this repo ships a\nscoped kill script of its own'),
      discoveredNotAssumed: has(
        'look for something like a `dev:kill` entry in `package.json`\n`scripts`',
      ),
      arbitraryRepos: has('Dungeonmaster runs inside arbitrary user repos'),
    }).toStrictEqual({ conditional: true, discoveredNotAssumed: true, arbitraryRepos: true });
  });

  it('VALID: template => keeps the commit as the only handoff channel, commits empty on a clean pass, and forbids stashing', () => {
    expect({
      onlyChannel: has('The commit message is the ONLY handoff channel'),
      recordRejections: has('**every artifact you rejected and why**'),
      emptyCommit: has('**A zero-finding pass still commits.**'),
      allowEmpty: has('`git commit --allow-empty`'),
      noStash: has('**Hard rule — DO NOT STASH.**'),
    }).toStrictEqual({
      onlyChannel: true,
      recordRejections: true,
      emptyCommit: true,
      allowEmpty: true,
      noStash: true,
    });
  });

  it('VALID: template => ties the signal to remaining SCOPE rather than to having touched code', () => {
    expect({
      scopeNotCode: has('Your signal reflects SCOPE, not whether you touched code.'),
      jobIsNotAReason: has(
        '**Fixing what you found is your job, and doing your job is not a reason to hand yourself back.**',
      ),
      isTheFreshEyes: has('You are the fresh-eyes reviewer of your minions'),
      doneOnCompleteLedger: has('Signal `done` when your Gate 8 ledger is COMPLETE'),
      partialOnlyRemainder: has('Signal `partial` **ONLY when real scope remains**'),
      costsAnAttempt: has('it costs a pt-chain attempt'),
      nameTheRemainder: has('name that remainder exactly in your commit'),
      noFailureSignal: has('**There is no failure signal for work you could have done.**'),
      blockedIsEnvironmental: has('Reserve `blocked` for an environment'),
    }).toStrictEqual({
      scopeNotCode: true,
      jobIsNotAReason: true,
      isTheFreshEyes: true,
      doneOnCompleteLedger: true,
      partialOnlyRemainder: true,
      costsAnAttempt: true,
      nameTheRemainder: true,
      noFailureSignal: true,
      blockedIsEnvironmental: true,
    });
  });

  it('VALID: template => spells both signal-back calls out verbatim', () => {
    const { template } = siegemasterPromptStatics.prompt;

    expect({
      done: /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' \}\)$/mu.test(
        template,
      ),
      partial:
        /^signal-back\(\{ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' \}\)$/mu.test(
          template,
        ),
    }).toStrictEqual({ done: true, partial: true });
  });

  it('VALID: template => carries no trace of the changed-code fixpoint rule it replaces', () => {
    const { template } = siegemasterPromptStatics.prompt;

    expect({
      convergenceVerdict: template.indexOf('Convergence IS the verdict'),
      doneOnlyIfUntouched: template.indexOf('Never signal `done` on a pass that touched code'),
      changedAnyCode: template.indexOf('If this pass CHANGED any code'),
      changedNothing: template.indexOf('If this pass changed NOTHING'),
    }).toStrictEqual({
      convergenceVerdict: -1,
      doneOnlyIfUntouched: -1,
      changedAnyCode: -1,
      changedNothing: -1,
    });
  });

  it('VALID: template => dispatches minions by minion-fetch with no workItemId and no signal-back', () => {
    expect({
      protocol: /^## Siegemaster-Minion Delegation Protocol$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      summonAsAgent: has('1. **Summon it as an `Agent` sub-agent.**'),
      minionName: has('siegemaster-minion'),
      noWorkItemId: has('(minion-fetch — NO\n   workItemId)'),
      model: has('`model: "sonnet"`'),
      subagentType: has('`subagent_type: "general-purpose"`'),
      neverSignals: has('It does NOT call `signal-back`; its final message IS the artifact.'),
    }).toStrictEqual({
      protocol: true,
      summonAsAgent: true,
      minionName: true,
      noWorkItemId: true,
      model: true,
      subagentType: true,
      neverSignals: true,
    });
  });

  it('VALID: template => makes the spawn brief the minion’s only context and quotes observables verbatim', () => {
    expect({
      onlyContext: has('**Your spawn message is the ONLY quest context it gets.**'),
      quoteNotParaphrase: has('**quote from the quest rather than paraphrasing**'),
      neverOptional: has('`SEEDED CANVAS`, `TERMINALS`, and `MUST CONFIRM` are never optional'),
      exclusivityLine: has(
        'EXCLUSIVITY: <DRIVING lane: You are the ONLY agent touching this system right now',
      ),
    }).toStrictEqual({
      onlyContext: true,
      quoteNotParaphrase: true,
      neverOptional: true,
      exclusivityLine: true,
    });
  });

  it('VALID: template => hands every minion an explicit LANE and a suite-audit switch', () => {
    expect({
      laneLine: has(
        'LANE: DRIVING (you are the only agent touching the system right now) | READ-ONLY',
      ),
      readOnlyNeverRunsLever: has('inspect only, mutate nothing, never run the reset lever'),
      leverIsDrivingOnly: has('to be run before EVERY path — DRIVING lane only'),
      suiteAuditSwitch: has('SUITE AUDIT: yes | no'),
      auditNeverReplacesWalk: has(
        'it is\n  extra work AFTER the walk and never a substitute for it',
      ),
      laneIsMandatory: has('`LANE` is what keeps two minions from destroying'),
    }).toStrictEqual({
      laneLine: true,
      readOnlyNeverRunsLever: true,
      leverIsDrivingOnly: true,
      suiteAuditSwitch: true,
      auditNeverReplacesWalk: true,
      laneIsMandatory: true,
    });
  });

  it('VALID: template => scopes the session to manual QA and refuses unrelated rewrites', () => {
    expect({
      section: /^## Scope$/mu.test(siegemasterPromptStatics.prompt.template),
      notYours: has('**Not yours:** work no flow asks for.'),
      neverWeaken: has('Never weaken, skip, or delete a test to reach green.'),
    }).toStrictEqual({ section: true, notYours: true, neverWeaken: true });
  });

  it('VALID: template => hardcodes no UI package path and carries no .spec.ts references', () => {
    const { template } = siegemasterPromptStatics.prompt;

    expect({
      uiPackage: template.indexOf('packages/web'),
      specTs: template.indexOf('.spec.ts'),
    }).toStrictEqual({ uiPackage: -1, specTs: -1 });
  });

  it('VALID: template => closes with numbered rules ending on the signal-back outcome', () => {
    expect({
      rules: /^## Rules$/mu.test(siegemasterPromptStatics.prompt.template),
      standardsFirst: has('1. **Standards before judging**'),
      gitOverLedger: has('2. **Git over ledger**'),
      everyFlow: has('3. **Every flow is your scope**'),
      observation: has('4. **Observation, never inspection**'),
      oneServerOneWalker: has('5. **One server, one driver**'),
      cleanWalkIsSuccess: has('8. **A clean walk is a success**'),
      everyDefectDestination: has('9. **Every defect gets a destination**'),
      rippleEveryFix: has('10. **Ripple-search every fix**'),
      noLedgerWrites: has('14. **No ledger writes**'),
      doneIsRight: has('`done` is the right\n    answer when your ledger is complete'),
    }).toStrictEqual({
      rules: true,
      standardsFirst: true,
      gitOverLedger: true,
      everyFlow: true,
      observation: true,
      oneServerOneWalker: true,
      cleanWalkIsSuccess: true,
      everyDefectDestination: true,
      rippleEveryFix: true,
      noLedgerWrites: true,
      doneIsRight: true,
    });
  });
});
