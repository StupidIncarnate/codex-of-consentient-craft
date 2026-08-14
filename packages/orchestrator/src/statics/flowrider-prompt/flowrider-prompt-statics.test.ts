import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { flowriderPromptStatics } from './flowrider-prompt-statics';

const has = (needle: string): boolean => flowriderPromptStatics.prompt.template.includes(needle);

describe('flowriderPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(flowriderPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(flowriderPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, on its own line', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Operation Context$/mu.test(template),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true });
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    expect(has(agentOperatingRulesStatics.markdown)).toBe(true);
  });

  // The operator judges artifacts, so it carries the criteria it judges by — verbatim, so a change
  // to the shared block cannot land on one side only. It does NOT carry the authoring method: the
  // minion that produced the artifact does, the same way codeweaver leaves the TDD method to
  // codeweaver-piece-minion and siegemaster leaves browser-driving to its walkers.
  it('VALID: template => embeds the shared judging criteria verbatim', () => {
    expect(has(flowEvidenceContractStatics.judgingMarkdown)).toBe(true);
  });

  it('VALID: template => does NOT carry the minion-only authoring method', () => {
    expect(has(flowEvidenceContractStatics.authoringMarkdown)).toBe(false);
  });

  // The item is a SLICE `relayTailFanOutTransformer` minted — one per package the runtime nodes tag
  // whose kind this track owns, plus one seam item — and `qaUnitsInPackageScopeTransformer` narrows
  // each denominator the dual way. A session told it covers every flow measures itself against units
  // a sibling item owns, so its remainder can never reach empty.
  it('VALID: template => frames the item as ONE package or seam SLICE, never the whole quest', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      ownsOneItem: has('You own ONE operation item, and that item is a **SLICE, not the whole'),
      slicedByPackage: has(
        'Flowrider slices BY\nPACKAGE: one item per package whose kind this track owns, plus ONE seam item for the glue nodes\nwhere two of those meet.',
      ),
      itemTextNamesTheSlice: has(
        "Your item's text says which you are — a `— package: <name>` or\n`— seam: <a> + <b>` suffix",
      ),
      operationContextCarriesTheNames: has(
        'the `packageNames` in your Operation Context state that same set,\nwhich you pass to every checklist call below',
      ),
      fallbackItemDeclaresNoNames: has('an item declaring none is the whole-track fallback'),
      notAssignedOne: has(
        'You are not assigned a flow: your slice cuts ACROSS the runtime flows listed there.',
      ),
      noWholeQuestCoverageClaim: template.indexOf('that item covers **EVERY flow on'),
      noAccountableForAllClaim: template.indexOf('accountable for all of them'),
    }).toStrictEqual({
      ownsOneItem: true,
      slicedByPackage: true,
      itemTextNamesTheSlice: true,
      operationContextCarriesTheNames: true,
      fallbackItemDeclaresNoNames: true,
      notAssignedOne: true,
      noWholeQuestCoverageClaim: -1,
      noAccountableForAllClaim: -1,
    });
  });

  // The seam item exists so the glue units have exactly ONE owner. Stated in one direction only, a
  // seam session reads "the glue is mine" and sweeps the per-package units it can see as well, which
  // is the double-ownership the partition was built to remove.
  it('VALID: template => denies the seams to a package slice and the per-package units to the seam slice', () => {
    expect({
      bothDirections: has(
        '**A package slice does NOT own the seams, and the seam slice does NOT own the per-package units.**',
      ),
      routesByOwningNode: has(
        "A\nunit routes by its owning NODE — one of this track's packages on it means that package's slice, two\nmean the seam slice",
      ),
      oneItemPerUnit: has('so every unit lands in exactly ONE item'),
      namesTheCost: has(
        'reaching across that line spends\nyour pt budget on units a sibling item is gated on while your own denominator stays short of empty.',
      ),
    }).toStrictEqual({
      bothDirections: true,
      routesByOwningNode: true,
      oneItemPerUnit: true,
      namesTheCost: true,
    });
  });

  it('VALID: template => declares verification of minion output to be the core job', () => {
    expect({
      verificationIsTheJob: has('The verification is the job.'),
      whyRoleExists: has(
        'A minion can write a hundred\ngreen tests that prove nothing, and catching that is why this role exists.',
      ),
    }).toStrictEqual({ verificationIsTheJob: true, whyRoleExists: true });
  });

  // These four ran as a separate "What Is Authoritative" section that restated Rules 1-4 in longer
  // form near the top of the prompt. One statement of each, in the numbered rules, is enough.
  it('VALID: template => states its authority order in the numbered rules, git first and the artifact last', () => {
    expect({
      noDuplicateSection: /^## What Is Authoritative/mu.test(
        flowriderPromptStatics.prompt.template,
      ),
      gitIsState: has('**Git is the state; the ledger is only whose turn it is**'),
      specIsTheTarget: has('an observable is a promise to a user, written down'),
      artifactIsClaim: has("**A minion's artifact is a claim, not evidence**"),
      claimCoversFixesAndGaps: has('its tests, its fixes and its gaps alike'),
      lastLine: has(
        'Your\n   own reading is the last line; no fresh session is coming to re-check your work',
      ),
    }).toStrictEqual({
      noDuplicateSection: false,
      gitIsState: true,
      specIsTheTarget: true,
      artifactIsClaim: true,
      claimCoversFixesAndGaps: true,
      lastLine: true,
    });
  });

  it('VALID: template => loads all three standards tools as a blocking first gate', () => {
    expect({
      blocking: has('### Gate 1: Load Project Standards (MCP — BLOCKING, do this FIRST)'),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
    }).toStrictEqual({ blocking: true, architecture: true, syntax: true, testing: true });
  });

  // A pt-N or resumed session inherits scope a prior session of its own role partly covered. Git
  // says what EXISTS; only the ledger says which part of this scope has already been worked.
  it('VALID: template => reads the ledger for prior passes of its own role, not just git', () => {
    expect({
      splitsTheTwoAuthorities: has(
        '**Trust git over the ledger for what EXISTS; trust the ledger for what your role has ALREADY DONE.**',
      ),
      detectsPriorPasses: has('the ledger shows completed\n  items of YOUR role'),
      jobIsTheRemainder: has('your job is the remainder'),
      noFixedLogWindow: has(
        'far enough back to cover the whole quest, not a\n  fixed number of lines',
      ),
      namesTheDefaultWindowTrap: has('has more commits than a default `-15` window shows'),
      readsBodies: has('read the BODIES'),
    }).toStrictEqual({
      splitsTheTwoAuthorities: true,
      detectsPriorPasses: true,
      jobIsTheRemainder: true,
      noFixedLogWindow: true,
      namesTheDefaultWindowTrap: true,
      readsBodies: true,
    });
  });

  it('VALID: template => requires opening test files rather than crediting a filename', () => {
    expect({
      openThem: has('confirmed by **opening the test files**'),
      neverCredit: has('Do not credit a\n   filename'),
      namesTheFailure: has('having opened none of them'),
    }).toStrictEqual({ openThem: true, neverCredit: true, namesTheFailure: true });
  });

  // Hand-building the inventory from get-quest is what this replaces: on a real quest that read
  // overflows to a file and costs ~19k tokens, and a session that skims it drops a flow. The tool
  // walks the graph with no model in the loop, so it cannot summarise or paraphrase.
  it('VALID: template => sources the inventory from get-qa-checklist rather than building it by hand', () => {
    expect({
      forbidsHandBuilding: has('**Do NOT hand-build the inventory from `get-quest`.**'),
      slicedCall: has("`get-qa-checklist({ questId, track: 'flowrider', packageNames: [...] })`"),
      omitFlowIdPassNames: has("omit `flowId`, pass\nyour item's names verbatim."),
      whatEachNarrowingDrops: has(
        "The track drops the operational flows; the names drop a sibling item's\nunits.",
      ),
      resultIsTheSlice: has(
        'What comes back is YOUR SLICE across every RUNTIME flow it lands on, exactly your scope.',
      ),
      operationalIsNotMine: has('**Operational flows are not yours**'),
      namesWhatOperationalIsAndWhoOwnsIt: has(
        'an operational flow is a one-time task sequence — a refactor\nsweep, an infra setup, a lint-rule registration — whose final state Siegemaster hand-checks.',
      ),
      itemsCarryLabelAndCheckSurface: has(
        'each\n  `observable` with its **verbatim** `label` and `checkSurface`.',
      ),
      doesNotAddThemBack: has('The track filter drops them for you; do not add them back.'),
      noModelInTheLoop: has(
        'It walks the flow graph with no model in the loop, so unlike a session reading a spec it cannot\nsummarise, skip a long tail, or paraphrase.',
      ),
      itemsAreTheDenominator: has('**`items` is your denominator**'),
      itemsAreWiderThanObservables: has(
        'it is WIDER than the observables: your\n  minions owe a test per path to every terminal and every branch too',
      ),
      surfacesTruncation: has('path enumeration hit its cap and the list is INCOMPLETE'),
      // MEASURED on quest e0210063 (7 flows, 144 observables): the unsliced checklist is 66k chars
      // against the 77k spec read. "A fraction of the spec read" is true per-flow and false at the
      // scale this gate fetches at, and a session that believes the call is cheap re-fetches it
      // instead of keeping the counts.
      honestAboutCost: has('**Budget for it honestly: even one slice is not a cheap call**'),
      fidelityNotTokens: has('What you buy is fidelity,\nnot tokens.'),
      fetchOnce: has("Fetch your slice's checklist ONCE and keep its counts"),
      noFalseFractionClaim: !has('costs a\nfraction of it'),
    }).toStrictEqual({
      forbidsHandBuilding: true,
      slicedCall: true,
      omitFlowIdPassNames: true,
      whatEachNarrowingDrops: true,
      resultIsTheSlice: true,
      operationalIsNotMine: true,
      namesWhatOperationalIsAndWhoOwnsIt: true,
      itemsCarryLabelAndCheckSurface: true,
      doesNotAddThemBack: true,
      noModelInTheLoop: true,
      itemsAreTheDenominator: true,
      itemsAreWiderThanObservables: true,
      surfacesTruncation: true,
      honestAboutCost: true,
      fidelityNotTokens: true,
      fetchOnce: true,
      noFalseFractionClaim: true,
    });
  });

  // Omitting `packageNames` is the failure that makes the gate unreachable rather than merely
  // wasteful: the remainder then spans the whole track while the gate clears at zero over the
  // slice, so the session works a sibling item's units forever and signals `partial` until the
  // pt chain is spent.
  it('VALID: template => names what omitting packageNames costs at the inventory call', () => {
    expect({
      omissionAtGate3: has(
        '**Omit the names and you measure the whole track**, so your `remainingItemIds` can never reach\nempty: the gate recomputes that remainder over your slice.',
      ),
      omissionAtTheReconcile: has(
        'Drop the names here and you gate yourself on the whole track, which no\namount of writing empties.',
      ),
    }).toStrictEqual({
      omissionAtGate3: true,
      omissionAtTheReconcile: true,
    });
  });

  // The operator makes exactly TWO `get-qa-checklist` calls of its own — Gate 3's inventory and
  // Gate 7's reconcile — and both are measured against the same slice its completion gate is. A
  // bare track-only call at EITHER one silently restores the whole-quest denominator, so the
  // absence of that form is asserted alongside the presence of the sliced one.
  it('VALID: template => carries packageNames on both of its own get-qa-checklist calls and no track-only form', () => {
    const { template } = flowriderPromptStatics.prompt;
    const slicedCall = "get-qa-checklist({ questId, track: 'flowrider', packageNames: [...] })";

    expect({
      slicedCallCount: template.split(slicedCall).length - 1,
      trackOnlyCall: template.indexOf("get-qa-checklist({ questId, track: 'flowrider' })"),
      authoringBriefCarriesTheNames: has(
        "YOUR CHECKLIST: call get-qa-checklist({ questId: 'QUEST_ID', flowId: '<id>', track: 'flowrider',\n  packageNames: <my item's names, verbatim> }) for EACH flow id above.",
      ),
      authoringBriefSaysTheOmittedUnitsAreNotHoles: has(
        "already narrowed to my slice — what it omits is another item's, not a hole.",
      ),
      coverageMinionBriefCarriesTheNames: has(
        "**Hand it your item's `packageNames` in the brief, verbatim from your Operation Context.**",
      ),
    }).toStrictEqual({
      slicedCallCount: 2,
      trackOnlyCall: -1,
      authoringBriefCarriesTheNames: true,
      authoringBriefSaysTheOmittedUnitsAreNotHoles: true,
      coverageMinionBriefCarriesTheNames: true,
    });
  });

  // With `track` AND the item's `packageNames` threaded through, remainingItemIds is the slice's
  // sign-off difference — the same set the completion gate recomputes from the quest file. A session
  // told to ignore it walks into the exact recall failure the gate exists to close.
  it('VALID: template => makes remainingItemIds flowrider’s own gate count rather than something to ignore', () => {
    expect({
      isTheGateCount: has(
        '`remainingItemIds` — **this is YOUR gate count, and you work it to zero.**',
      ),
      isThePerTrackDifference: has(
        "With\n  `track: 'flowrider'` AND your `packageNames` it is your SLICE's sign-off difference: every unit\n  your item owns carrying no `flowriderSignoff` yet.",
      ),
      gateRecomputesIt: has(
        'the completion\n  gate recomputes exactly this set from the quest file and refuses `done` while it is non-empty',
      ),
      ignoringItIsTheFailure: has('Ignoring it is the recall failure the gate exists to close.'),
    }).toStrictEqual({
      isTheGateCount: true,
      isThePerTrackDifference: true,
      gateRecomputesIt: true,
      ignoringItIsTheFailure: true,
    });
  });

  // An all-operational quest HAS flows, so the "no flows at all" case never fires for it — the
  // flowrider-track checklist just returns none of them. Without its own sibling case a session
  // reads the empty result as a tooling failure and re-fetches untracked to find something to cover.
  it('VALID: template => gives an empty checklist its own real-state case, flow-less or all-operational', () => {
    expect({
      emptyIsReal: has('**An EMPTY checklist is a real state, not an error.**'),
      bothWaysToReachIt: has(
        'A quest with no flows returns none, and so\ndoes an all-operational quest, which HAS flows the `flowrider` track simply does not measure.',
      ),
      gateStillBinds: has(
        'Your\ngate still binds and it still recomputes, it simply yields zero units, so `done` is honest the\nmoment you say so.',
      ),
      noWidening: has('do NOT widen the call to find something to cover'),
      noSigningOperationalUnits: has(
        'do NOT sign units on an operational flow: they are outside your denominator,\nso a signature there proves nothing and clears nothing',
      ),
      skipsTheMiddleGates: has('Say so plainly, skip Gates 4 through 7,\ncommit that finding'),
    }).toStrictEqual({
      emptyIsReal: true,
      bothWaysToReachIt: true,
      gateStillBinds: true,
      noWidening: true,
      noSigningOperationalUnits: true,
      skipsTheMiddleGates: true,
    });
  });

  // Design decisions carry the rationale AND a Relates-to list naming the exact observables they
  // govern — the trap an assertion is supposed to catch. Without them a minion writes the easy one.
  it('VALID: template => treats the quest design decisions as mandatory briefing material', () => {
    expect({
      mandatory: has("**The quest's design decisions**"),
      notOptional: has('and you must still get yourself'),
      namesTheRelatesTo: has('`Relates to:` list naming the nodes and observables it'),
      contrastsTextWithRationale: has(
        "An observable's text says what to assert; its design decision says what goes\n   wrong if you assert it the easy way.",
      ),
      namesTheFailure: has('gets one without the other writes the easy'),
    }).toStrictEqual({
      mandatory: true,
      notOptional: true,
      namesTheRelatesTo: true,
      contrastsTextWithRationale: true,
      namesTheFailure: true,
    });
  });

  it('VALID: template => bundles flows by shared surface, layer, and coupled observables', () => {
    expect({
      sharedSurface: has('**Shared surface or harness**'),
      sharedLayer: has('**Shared layer**'),
      coupled: has('**Coupled observables**'),
      splitBig: has('**Split anything too big to hold.**'),
      parallel: has('**dispatch them in parallel**'),
    }).toStrictEqual({
      sharedSurface: true,
      sharedLayer: true,
      coupled: true,
      splitBig: true,
      parallel: true,
    });
  });

  // Without a size anchor a session defaults to one bundle per flow, which is the per-flow model the
  // operator conversion replaced — and the observable count is what actually predicts a skim.
  it('VALID: template => anchors bundle size by observable count and dispatches by surface', () => {
    expect({
      sizeAnchor: has('A bundle much past ~25 observables is one a minion will skim'),
      notOnePerFlow: has('prefer a handful of well-briefed bundles over one per flow'),
      bySurfaceNotByFlow: has('You dispatch by\n  SURFACE, not by flow'),
      countPerBundleInThePlan: has('the observable count per bundle'),
    }).toStrictEqual({
      sizeAnchor: true,
      notOnePerFlow: true,
      bySurfaceNotByFlow: true,
      countPerBundleInThePlan: true,
    });
  });

  it('VALID: template => keeps the build and shared harnesses out of the parallel lane', () => {
    expect({
      authoringOnly: has('Bundles are independent at the AUTHORING layer'),
      operatorBuildsFirst: has('Run `npm run build` yourself, once, BEFORE you dispatch anything'),
      minionsMayNotBuild: has('Then forbid your minions from building'),
      concurrentTscNamed: has('N concurrent `tsc` runs\n  writing one `dist/`'),
      oneHarnessOwner: has('ONE bundle owns it'),
      lastWriteWins: has('Parallel minions editing one file is last-write-wins.'),
    }).toStrictEqual({
      authoringOnly: true,
      operatorBuildsFirst: true,
      minionsMayNotBuild: true,
      concurrentTscNamed: true,
      oneHarnessOwner: true,
      lastWriteWins: true,
    });
  });

  // At quest scale a single deep pass over every assertion is not completable in one turn, so an
  // unqualified "verify everything" instruction produces exactly the hand-waving it forbids. The
  // split keeps the cheap check total and forces the expensive one to be risk-ranked AND named.
  it('VALID: template => splits artifact verification into a total structural pass and a named semantic pass', () => {
    expect({
      namesTheScaleProblem: has(
        'At quest scale you cannot deep-read several hundred assertions in one turn',
      ),
      passATotal: has('**Pass A — structural, on 100% of claims.**'),
      passANoExcuseToSample: has('so there is no excuse to sample it'),
      passAChecksNaming: has('obeys the\nnaming rules'),
      passAChecksNotAPlaywrightSpec: has(
        'is a `.integration.test.ts` or a `.test.ts` rather than a Playwright spec',
      ),
      passAChecksHarnessReuse: has('reuses an existing harness rather than hand-rolling one'),
      passBSemantic: has('**Pass B — semantic, by opening the file.**'),
      passBMandatoryCategories: has('MANDATORY for every one of these, no sampling'),
      passBCatchesLayerDisagreement: has(
        "every claim whose asserted layer disagrees with its unit's `checkSurface`",
      ),
      passBCatchesOutermostLayerOnly: has(
        'every claim proved only at the outermost layer on a flow that reaches deeper',
      ),
      namedSample: has('**named random sample of the remainder**'),
      silentCapIsALie: has(
        'A sample you do not name is a silent cap, and reads to the next session as "all of this was checked"',
      ),
    }).toStrictEqual({
      namesTheScaleProblem: true,
      passATotal: true,
      passANoExcuseToSample: true,
      passAChecksNaming: true,
      passAChecksNotAPlaywrightSpec: true,
      passAChecksHarnessReuse: true,
      passBSemantic: true,
      passBMandatoryCategories: true,
      passBCatchesLayerDisagreement: true,
      passBCatchesOutermostLayerOnly: true,
      namedSample: true,
      silentCapIsALie: true,
    });
  });

  // The minion promises the operator verifies its fixes and adjudicates its handed-up defects. If
  // the operator is never told to, a real fix ships unverified and a proven defect evaporates.
  it('VALID: template => adjudicates the minion FIXES MADE block including the ripple', () => {
    expect({
      adjudicates: has("**Adjudicate the minion's `FIXES MADE`.**"),
      fixIsAClaim: has('A fix is a claim like any other.'),
      redBeforeTheChange: has('confirm the red was witnessed BEFORE the change'),
      rippleIsTheOperators: has(
        'A minion sees one bundle; you see the quest, so the ripple\nis yours to finish.',
      ),
      namesTheConsequence: has(
        'A minion sees one bundle; you see the quest, so the ripple\nis yours to finish.',
      ),
    }).toStrictEqual({
      adjudicates: true,
      fixIsAClaim: true,
      redBeforeTheChange: true,
      rippleIsTheOperators: true,
      namesTheConsequence: true,
    });
  });

  it('VALID: template => forces a take-or-record verdict on every defect a minion handed up', () => {
    expect({
      adjudicates: has("**Adjudicate the minion's `DEFECTS LEFT UNFIXED`.**"),
      minionVerdictIsAProposal: has('is a proposal,\nnot a verdict'),
      takeIt: has('**take it**'),
      passItOn: has('**pass it on**'),
      mayNotEvaporate: has('What you may not\ndo is let it evaporate'),
      namesTheConsequence: has('leaves a red test looking\nlike a mistake instead of a finding'),
    }).toStrictEqual({
      adjudicates: true,
      minionVerdictIsAProposal: true,
      takeIt: true,
      passItOn: true,
      mayNotEvaporate: true,
      namesTheConsequence: true,
    });
  });

  it('VALID: template => verifies a doubtful claim by mutating production and reverting', () => {
    expect({
      mutate: has('**Verify by mutation when a claim matters and you are unsure.**'),
      revert: has('confirm `git diff` on that file is empty'),
      liability: has('Mutation is the only way to know a test bites'),
    }).toStrictEqual({ mutate: true, revert: true, liability: true });
  });

  it('VALID: template => allows one re-dispatch per bundle, then inline repair', () => {
    expect({
      pivot: has('**Pivot rule.**'),
      onceThenInline: has(
        'One re-dispatch per bundle with a sharper brief naming exactly which criterion it\nfailed.',
      ),
      recoverNoArtifact: has('recover its work via\n`git status`/`git diff`'),
    }).toStrictEqual({ pivot: true, onceThenInline: true, recoverNoArtifact: true });
  });

  // Retyping a full slice's rows from memory is how a session drops the ones it forgot. A set
  // difference over ids can actually be completed, and it is what catches an unbundled flow. The
  // second call must carry the SAME `packageNames` as Gate 3: gated on the whole track's remainder,
  // a sliced item is still gated on the whole quest, which is the failure the slicing removes.
  it('VALID: template => reconciles its own slice by set difference under the same packageNames', () => {
    expect({
      gate: has('### Gate 7: The Sign-Off Reconcile For Your Slice'),
      unitsAreTheSlices: has('Every unit YOUR SLICE owns carries a `flowriderSignoff`'),
      assembleNotRetype: has('**Assemble the reconcile; do not retype it.**'),
      reconcileById: has('reconcile **by checklist item id** against\nGate 3'),
      recallCarriesTheNames: has(
        "re-call `get-qa-checklist({ questId, track: 'flowrider', packageNames: [...] })` with the\nSAME names",
      ),
      differenceMustBeEmpty: has('must be EMPTY'),
      emptyForTheSlice: has('empty **for your slice**, the set your\ncompletion gate recomputes'),
      droppingTheNamesGatesOnTheTrack: has(
        'Drop the names here and you gate yourself on the whole track, which no\namount of writing empties.',
      ),
      // Graph-derived ids reproduce byte-identically, so re-fetching diffs against the same list
      // rather than the session's recollection of it.
      refetchRatherThanRecall: has(
        'The ids derive from the graph, so the same call reproduces them\nbyte-identically and you diff against the same list rather than your memory of it',
      ),
      catchesUnbundledFlow: has('That is the check\nthat catches a flow nobody bundled.'),
      // Terminals and branches are exactly what a happy-path-only suite omits, and they are
      // invisible to an observable-only reconciliation.
      includesTerminalsAndBranches: has('**Terminals and branches are units too**'),
      namesTheHappyPathFailure: has(
        '"I covered the happy path and stopped" shows up here as\nterminal ids with no signature',
      ),
      offMapIsSiegemasters: has("Off-map families are Siegemaster's charter"),
      hostileInputStaysMine: has('`hostile-input` is\nalready your fixture rule'),
      exitIsTheDifference: has(
        '**Exit Criteria:** The set difference is empty for your slice. Every seam it owns is checked.',
      ),
    }).toStrictEqual({
      gate: true,
      unitsAreTheSlices: true,
      assembleNotRetype: true,
      reconcileById: true,
      recallCarriesTheNames: true,
      differenceMustBeEmpty: true,
      emptyForTheSlice: true,
      droppingTheNamesGatesOnTheTrack: true,
      refetchRatherThanRecall: true,
      catchesUnbundledFlow: true,
      includesTerminalsAndBranches: true,
      namesTheHappyPathFailure: true,
      offMapIsSiegemasters: true,
      hostileInputStaysMine: true,
      exitIsTheDifference: true,
    });
  });

  // The authoring minion that wrote a test believes it proves the observable; a signature from it
  // would satisfy the gate the instant authoring returned. Only the coverage audit signs, and the
  // operator signs whatever it adds afterwards, because nothing runs after the operator's spec gate.
  it('VALID: template => routes the track to the coverage minion and keeps the operator signing its own additions', () => {
    expect({
      auditWritesTheTrack: has(
        '**A `flowrider-coverage-minion` writes the track; the authoring minions never sign their own\nwork.**',
      ),
      dispatchedAfterAuthoring: has(
        'Dispatch it once the authoring bundles are back and their tests have landed, before this\nreconcile.',
      ),
      selfSigningPreSatisfies: has(
        'letting it sign\nwould pre-satisfy the gate the instant authoring returned',
      ),
      operatorSignsItsAdditions: has('**You sign too, and you must.**'),
      addedAfterTheAudit: has(
        'You can ADD observables at your own spec gate below, AFTER the audit\npass has already run.',
      ),
      sameEvidenceBar: has('a test `file:line` plus what makes that\ntest fail'),
    }).toStrictEqual({
      auditWritesTheTrack: true,
      dispatchedAfterAuthoring: true,
      selfSigningPreSatisfies: true,
      operatorSignsItsAdditions: true,
      addedAfterTheAudit: true,
      sameEvidenceBar: true,
    });
  });

  // The operator holds ONE slice of the package dimension, so a coverage minion briefed without it
  // measures the whole quest: it audits units a sibling flowrider item owns and leaves part of this
  // item's own denominator unsigned, which is the gate refusal this brief line exists to prevent.
  it('VALID: template => hands the coverage minion the item’s packageNames and rules Playwright out as evidence', () => {
    expect({
      handsOverTheSlice: has(
        "**Hand it your item's `packageNames` in the brief, verbatim from your Operation Context.**",
      ),
      denominatorIsTheSlice: has('Its\ndenominator is your slice, not the whole quest'),
      passedAlongsideTrack: has(
        "it passes them to `get-qa-checklist` alongside\n`track: 'flowrider'`",
      ),
      namesTheCostOfOmitting: has(
        'a brief that omits them sends it across units a sibling flowrider item\nowns while leaving part of yours unaudited',
      ),
      playwrightIsNotEvidence: has('a Playwright `.e2e.ts` is never\nevidence on this track'),
      browserClaimIsGroundstompersUnit: has(
        'a browser-read claim is a Groundstomper unit, outside this denominator by\npackage kind',
      ),
    }).toStrictEqual({
      handsOverTheSlice: true,
      denominatorIsTheSlice: true,
      passedAlongsideTrack: true,
      namesTheCostOfOmitting: true,
      playwrightIsNotEvidence: true,
      browserClaimIsGroundstompersUnit: true,
    });
  });

  // An observable delete is refused by the additive guard, so "move it" is not an available move.
  // A session that believes it is silently loses the observable it thought it relocated.
  it('VALID: template => replaces "move the observable" with a restate-plus-add pair', () => {
    expect({
      impossible: has('**"Move the observable to the runtime flow" is IMPOSSIBLE.**'),
      guardRefusesDeletes: has('The additive guard refuses every\nobservable delete by design'),
      twoAdditiveMoves: has('Make TWO additive moves instead'),
      restateNamesTheRuntimeFlow: has(
        'RESTATE the operational observable so its text names the runtime\nflow that proves it, and ADD the covering observable on that runtime flow',
      ),
      bothExistAfterwards: has(
        'Both observables exist\nafterwards, `addedBy` links the added one to this pass',
      ),
    }).toStrictEqual({
      impossible: true,
      guardRefusesDeletes: true,
      twoAdditiveMoves: true,
      restateNamesTheRuntimeFlow: true,
      bothExistAfterwards: true,
    });
  });

  // A permanently unprovable unit handed to a pt continuation burns the chain to maxAttempts on
  // sessions that provably cannot close it, and the quest blocks with the unit still open. The
  // `unconfirmable` signature closes it honestly in one pass instead.
  it('VALID: template => signs an unclosable unit unconfirmable instead of pt-chaining it', () => {
    expect({
      signedNotChained: has(
        '**A unit you genuinely cannot close is signed `unconfirmable` — it is NOT a reason to signal\n`partial`.**',
      ),
      // What an `unconfirmable` must carry is stated once, in the shared evidence contract the
      // template embeds above; the gate paragraph points at it rather than restating it.
      evidenceAndQuestion: has(
        '`evidence` says\n  what was TRIED and why each attempt could not reach it, and a `question` naming what someone else\n  would need is REQUIRED',
      ),
      namesTheChainCost: has(
        'burns the chain to `maxAttempts` on sessions that provably\ncannot close it, and then blocks the quest',
      ),
      partialIsForRealRemainder: has('`partial` is for scope a fresh session really could\nfinish'),
      architecturalIsADefect: has('is scope you hand on as a `DEFECT:`, not scope\n  you take'),
      trivialFixIsNotADefect: has(
        'defect you could have fixed in a line is not a `DEFECT:`, it is a fix you skipped.',
      ),
    }).toStrictEqual({
      signedNotChained: true,
      evidenceAndQuestion: true,
      namesTheChainCost: true,
      partialIsForRealRemainder: true,
      architecturalIsADefect: true,
      trivialFixIsNotADefect: true,
    });
  });

  it('VALID: template => checks the cross-flow seams its own slice owns, and leaves the rest', () => {
    expect({
      onlyTheSeamsItOwns: has('Then check the seams **your slice owns**:'),
      packageSliceLeavesTheGlue: has(
        "on a package slice the glue units are the SEAM item's, not\nyours — name them and leave them",
      ),
      seamSliceOwnsTheGlue: has('on the seam item they ARE your denominator'),
      sliceStillSpansFlows: has(
        'Your slice spans\nseveral runtime flows either way, so run these across the ones it lands on',
      ),
      bothClaim: has('**two flows both claim**'),
      mutualDeferral: has('did\n  both sides defer to each other so neither covered it?'),
      punctedToUnrunFlow: has('so neither covered it? That has happened here.'),
      noObservables: has('a node carrying **no observables at all**'),
      twinSurface: has('**twin surface**'),
    }).toStrictEqual({
      onlyTheSeamsItOwns: true,
      packageSliceLeavesTheGlue: true,
      seamSliceOwnsTheGlue: true,
      sliceStillSpansFlows: true,
      bothClaim: true,
      mutualDeferral: true,
      punctedToUnrunFlow: true,
      noObservables: true,
      twinSurface: true,
    });
  });

  it('VALID: template => requires an added observable be covered in the same pass at an observing layer', () => {
    expect({
      coverItNow: has(
        '**cover it in this same session, at a layer that can observe\nwhat it claims, then sign it.**',
      ),
      namesTheCost: has('hands your\nsuccessor a manufactured hole'),
    }).toStrictEqual({ coverItNow: true, namesTheCost: true });
  });

  it('VALID: template => rebuilds at ward time when it or a minion changed implementation, unpiped', () => {
    expect({
      rebuildCondition: has(
        '**If you or any minion changed a file outside the test tree, rebuild first**',
      ),
      checksMinionGotchas: has('check their `GOTCHAS`'),
      minionsCannotBuild: has('Minions are forbidden from building'),
      skipWhenTestsOnly: has('If nothing but\ntests changed since Gate 4, skip the rebuild.'),
      // The unpiped-build rule and the stale-`dist` consequence are universal, so they live in the
      // `wardDiscipline` session snippet every agent receives at start. This template's budget
      // header requires anything a shared block states to be referred to here, not restated.
      defersBuildMechanics: has('(build mechanics: the\nward-discipline snippet)'),
      neverPipe: has('Never pipe the build'),
      staleDist: has('a stale `dist` produces phantom failures'),
    }).toStrictEqual({
      rebuildCondition: true,
      checksMinionGotchas: true,
      minionsCannotBuild: true,
      skipWhenTestsOnly: true,
      defersBuildMechanics: true,
      neverPipe: false,
      staleDist: false,
    });
  });

  it('VALID: template => makes a test left red to prove a DEFECT the only allowed ward failure', () => {
    expect({
      onlyAllowedRed: has(
        '**A test left red to prove a `DEFECT:` is an allowed ward failure, and the ONLY one.**',
      ),
      mostAreClosedNotLeftRed: has(
        'Most defects\nyou close yourself, and a closed defect leaves no red behind',
      ),
      wasRedIsNotAVerdict: has('"It was red when I got here" is not a verdict'),
      noForbiddenFraming: !has('You are forbidden from\nfixing implementation'),
      neverWeakenForGreen: has('Never weaken, skip, or delete such a test to buy a green.'),
      everyOtherRedIsYours: has('**Every OTHER red\nis yours to fix before you signal**'),
      includesFixableDefects: has('a defect small enough for\nyou to close'),
      exitCriteriaCarvesItOut: has(
        '**Exit Criteria:** Scoped ward green apart from the tests you deliberately left red',
      ),
    }).toStrictEqual({
      onlyAllowedRed: true,
      mostAreClosedNotLeftRed: true,
      wasRedIsNotAVerdict: true,
      noForbiddenFraming: true,
      neverWeakenForGreen: true,
      everyOtherRedIsYours: true,
      includesFixableDefects: true,
      exitCriteriaCarvesItOut: true,
    });
  });

  it('VALID: template => distrusts a suspiciously cheap green and reads ward detail', () => {
    expect({
      distrust: has(
        '**If a green run looks impossibly fast for the work it claims, do not accept it.**',
      ),
      scopedInvocation: has('npm run ward -- -- <the files changed>'),
      noRedundantOnly: !has('--only lint,typecheck,unit,integration,e2e'),
      explainsTheDefault: has(
        'Omitting `--only` runs all five checks, which is\nthe default you want, and your file set always has a Jest counterpart',
      ),
      detail: has('`npm run ward -- detail <runId>`'),
      discoveredIsNotRan: has('A "discovered" file count is\nnot a count of tests that ran'),
    }).toStrictEqual({
      distrust: true,
      scopedInvocation: true,
      noRedundantOnly: true,
      explainsTheDefault: true,
      detail: true,
      discoveredIsNotRan: true,
    });
  });

  it('VALID: template => keeps the commit as the only handoff channel and forbids stashing', () => {
    expect({
      onlyChannel: has('**The commit message is the ONLY handoff channel'),
      recordRejections: has('**every artifact you rejected and why**'),
      recordsTheSample: has("**which observables got Gate 6's deep pass and which\nwere sampled**"),
      noStash: has('**Hard rule — DO NOT STASH.**'),
    }).toStrictEqual({
      onlyChannel: true,
      recordRejections: true,
      recordsTheSample: true,
      noStash: true,
    });
  });

  it('VALID: template => ties the signal to remaining SCOPE rather than to having touched code', () => {
    expect({
      scopeNotCode: has('**Your signal reflects SCOPE, not whether you touched code.**'),
      doneOnComplete: has('Signal `done` when Gate 7 passes'),
      jobIsNotAReason: has(
        '**Authoring tests is your job; doing your job is not a\nreason to hand yourself back.**',
      ),
      isTheFreshEyes: has("You are the fresh-eyes reviewer of your minions' work"),
      partialOnlyRemainder: has('Signal `partial` **only when real scope remains**'),
      costsAnAttempt: has('it costs a pt-chain attempt'),
    }).toStrictEqual({
      scopeNotCode: true,
      doneOnComplete: true,
      jobIsNotAReason: true,
      isTheFreshEyes: true,
      partialOnlyRemainder: true,
      costsAnAttempt: true,
    });
  });

  it('VALID: template => carries no trace of the changed-code fixpoint rule it replaces', () => {
    const { template } = flowriderPromptStatics.prompt;

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
      protocol: /^## Flowrider-Authoring-Minion Delegation Protocol$/mu.test(
        flowriderPromptStatics.prompt.template,
      ),
      minionFetch: has(
        "`get-agent-prompt({ agent: 'flowrider-authoring-minion', questId: 'QUEST_ID' })` (minion-fetch — NO\n   workItemId)",
      ),
      model: has('`model: "sonnet"`'),
      subagentType: has('`subagent_type: "general-purpose"`'),
      neverSignals: has('It does NOT\n   call `signal-back`; its final message IS the artifact.'),
    }).toStrictEqual({
      protocol: true,
      minionFetch: true,
      model: true,
      subagentType: true,
      neverSignals: true,
    });
  });

  // The brief no longer transcribes observables: the minion fetches them from the tool, which
  // returns them verbatim by construction. Hand-copying a hundred-odd observables cost the operator
  // a large part of its turn AND put a transcription error between the spec and the test — the very
  // failure the old "quote, never paraphrase" rule existed to prevent.
  it('VALID: template => has the minion fetch its own checklist instead of transcribing observables', () => {
    expect({
      judgementContext: has('**Your spawn message is its only JUDGEMENT context.**'),
      forbidsTranscription: has('**Do NOT transcribe the observables into the brief.**'),
      minionFetchesPerFlow: has(
        '`get-qa-checklist` itself, once per flow in its bundle, carrying your `track` and',
      ),
      minionFetchIsSliced: has('`packageNames` so it gets your slice.'),
      namesTheTranscriptionRisk: has(
        'puts a\n   transcription error between the spec and the test',
      ),
      briefCarriesWhatToolCannot: has(
        "Your brief carries what the tool CANNOT know:\n   why these flows group, what already covers them, which harness is whose, and how far the minion's\n   authority runs.",
      ),
      briefLine: has('YOUR CHECKLIST: call get-qa-checklist('),
      noTranscribedObservableLine: !has('- <observable-id> [<type>]:'),
    }).toStrictEqual({
      judgementContext: true,
      forbidsTranscription: true,
      minionFetchesPerFlow: true,
      minionFetchIsSliced: true,
      namesTheTranscriptionRisk: true,
      briefCarriesWhatToolCannot: true,
      briefLine: true,
      noTranscribedObservableLine: true,
    });
  });

  // Every one of these lines is consumed by a named step of the minion's own prompt. A minion that
  // has to rediscover them spends its budget on the operator's homework instead of on assertions.
  it('VALID: template => carries the brief lines the minion prompt actually consumes', () => {
    expect({
      designDecisions: has('DESIGN DECISIONS GOVERNING THIS BUNDLE:'),
      entryPoints: has('ENTRY POINTS:'),
      entryPointsSaveNDiscoveryPasses: has('so N minions do not each run the same discovery pass'),
      layers: has('LAYERS THIS BUNDLE CROSSES:'),
      alreadyCovered: has('ALREADY COVERED:'),
      alreadyCoveredHasExplicitNone: has(
        'If genuinely nothing covers this bundle, say "nothing" explicitly',
      ),
      fixtureRequirements: has('FIXTURE REQUIREMENTS:'),
      neverOptional: has(
        '`DESIGN DECISIONS`, `ALREADY COVERED` and `FIXTURE REQUIREMENTS` are never optional',
      ),
      namesTheCost: has('spends its budget\n   on your homework instead of on assertions'),
    }).toStrictEqual({
      designDecisions: true,
      entryPoints: true,
      entryPointsSaveNDiscoveryPasses: true,
      layers: true,
      alreadyCovered: true,
      alreadyCoveredHasExplicitNone: true,
      fixtureRequirements: true,
      neverOptional: true,
      namesTheCost: true,
    });
  });

  // The minion's own trace is authoritative — it reads the code, the operator read a summary. The
  // brief must say so, or a minion defers to a layer list that missed a layer.
  it('VALID: template => hands the LAYERS line over as a hypothesis the minion may overrule', () => {
    expect({
      isAHypothesis: has('my hypothesis'),
      minionTraceWins: has('its own trace\n  is authoritative'),
      reportsTheMiss: has('any layer I missed goes in GOTCHAS'),
    }).toStrictEqual({ isAHypothesis: true, minionTraceWins: true, reportsTheMiss: true });
  });

  // Every Playwright and dev-server token belongs to Groundstomper. Leaving any of them here would
  // give a session two plausible readings of who owns the browser, and it would author both.
  it('VALID: template => hands the browser to Groundstomper and keeps no Playwright ownership', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      browserIsNotMine: has('**The browser is not yours, and neither is Playwright.**'),
      groundstomperOwnsTheWalk: has(
        'Groundstomper owns the browser walk — one\nsession per runtime flow that lands in a package a browser can reach, authoring the `.e2e.ts`\nfiles.',
      ),
      authorsNoPlaywright: has('You author NO Playwright, you start no server, and you need none'),
      everythingRunsUnderJest: has(
        'everything you write runs\nunder Jest against real routes, queues and file systems',
      ),
      browserClaimIsNotAHole: has(
        "A claim you can only reach through a browser\nis Groundstomper's unit, not a hole in your suite",
      ),
      outputIsBelowTheBrowser: has(
        "Your output is your slice's flow-perspective suite at every layer BELOW the browser:",
      ),
      noWebServerToken: template.indexOf('webServer'),
      noDevServerToken: template.indexOf('dev server, and you are not given one'),
    }).toStrictEqual({
      browserIsNotMine: true,
      groundstomperOwnsTheWalk: true,
      authorsNoPlaywright: true,
      everythingRunsUnderJest: true,
      browserClaimIsNotAHole: true,
      outputIsBelowTheBrowser: true,
      noWebServerToken: -1,
      noDevServerToken: -1,
    });
  });

  it('VALID: template => keeps every dev-server token out of the brief it hands a minion', () => {
    const { template } = flowriderPromptStatics.prompt;
    const brief = template.slice(
      template.indexOf('FEATURE: <1-2 lines'),
      template.indexOf('Omit a line only when'),
    );

    expect({
      briefDelimitersFound: [
        template.includes('FEATURE: <1-2 lines'),
        template.includes('Omit a line only when'),
      ],
      briefIsNonEmpty: brief.length > 0,
      devServerCommand: brief.includes('Dev Server Command'),
      devServerUrl: brief.includes('Dev Server URL'),
      webServerBlock: brief.includes('webServer'),
    }).toStrictEqual({
      briefDelimitersFound: [true, true],
      briefIsNonEmpty: true,
      devServerCommand: false,
      devServerUrl: false,
      webServerBlock: false,
    });
  });

  // The minion prompt already forbids building and every git write. Restating both in full in every
  // brief crowds out the bundle-specific prohibitions that are the only ones the operator knows.
  it('VALID: template => reserves the brief ALSO FORBIDDEN line for bundle-specific prohibitions', () => {
    expect({
      bundleSpecificOnly: has('ALSO FORBIDDEN: <bundle-specific only;'),
      pointsAtTheMinionPrompt: has('its own prompt already forbids `npm run build` and `git`'),
    }).toStrictEqual({
      bundleSpecificOnly: true,
      pointsAtTheMinionPrompt: true,
    });
  });

  it('VALID: template => grants implementation-fix authority for holes its own testing exposes', () => {
    expect({
      section: /^## Your Authority — What You May Change$/mu.test(
        flowriderPromptStatics.prompt.template,
      ),
      testWriterFirstNotOnly: has('**You are a TEST WRITER and a REVIEWER first.**'),
      notForbidden: has('You are NOT forbidden from touching implementation'),
      mayChangeImplementation: has('**You MAY change implementation, and often you should.**'),
      namesTheHoles: has('a missing\nguard, an unhandled branch, a wrong default, an off-by-one'),
      redFirst: has('**fix it, red test first**'),
      delegationIsNotObligatory: has('**Delegation is your default, not an obligation.**'),
      mayWorkInline: has('do it inline'),
    }).toStrictEqual({
      section: true,
      testWriterFirstNotOnly: true,
      notForbidden: true,
      mayChangeImplementation: true,
      namesTheHoles: true,
      redFirst: true,
      delegationIsNotObligatory: true,
      mayWorkInline: true,
    });
  });

  it('VALID: template => bounds that authority at rebuilds, reversed fixes, and weakened tests', () => {
    expect({
      doNotRebuildTheFeature: has('**Close the hole; do not rebuild the feature.**'),
      noScopeNoFlowAsksFor: has('or build scope no flow asks for'),
      neverBendImplementation: has('**Never bend the implementation to make a test pass.**'),
      weakeningRunBackwards: has('That is weakening a test, run backwards.'),
      neverWeaken: has('**Never weaken, skip, or delete a test to reach green**'),
      certifiesTheBreak: has('certifies the break'),
      fixesGoInTheCommit: has('Every change you make beyond a test goes in your commit message'),
    }).toStrictEqual({
      doNotRebuildTheFeature: true,
      noScopeNoFlowAsksFor: true,
      neverBendImplementation: true,
      weakeningRunBackwards: true,
      neverWeaken: true,
      certifiesTheBreak: true,
      fixesGoInTheCommit: true,
    });
  });

  it('VALID: template => hands the minion an explicit FIX AUTHORITY line', () => {
    expect({
      briefLine: has('FIX AUTHORITY: <what it may change beyond tests.'),
      defaultIsMayFix: has(
        'it MAY close a genuine implementation hole\n  its own testing exposes, red-first',
      ),
      mustReportFixes: has('must report every such change'),
      narrowable: has('Name anything it must NOT\n  touch'),
      architecturalReported: has('an architectural\n  fix is reported, not taken'),
    }).toStrictEqual({
      briefLine: true,
      defaultIsMayFix: true,
      mustReportFixes: true,
      narrowable: true,
      architecturalReported: true,
    });
  });

  // ask-user-question's canned reply tells the caller to stop generating. A dispatched work item
  // that obeys it never reaches signal-back and wedges every role behind it.
  it('VALID: template => overrides the ask-user-question wait instruction for a dispatched item', () => {
    expect({
      askUser: has('`ask-user-question`'),
      prosePlusLost: has('A real defect recorded only in prose gets lost'),
      overridesTheWait: has('does NOT apply to you'),
      namesTheWedge: has('wedges every role behind you'),
      carryOn: has('commit body, carry on'),
    }).toStrictEqual({
      askUser: true,
      prosePlusLost: true,
      overridesTheWait: true,
      namesTheWedge: true,
      carryOn: true,
    });
  });

  // The `.e2e.ts` colocation rule lives with the role that writes those files. Restating it here
  // reads as a licence to write one.
  it('VALID: template => carries no e2e colocation rule of its own', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      colocationRule: template.indexOf('<ui-package>/src/flows/<route>/<feature>.e2e.ts'),
      exclusivityRule: template.indexOf('**e2e = Playwright exclusively'),
      startsIsWhereItLives: template.indexOf('Where the test STARTS is where it lives'),
      stillNamesIntegration: has('`.integration.test.ts`'),
    }).toStrictEqual({
      colocationRule: -1,
      exclusivityRule: -1,
      startsIsWhereItLives: -1,
      stillNamesIntegration: true,
    });
  });

  it('VALID: template => hardcodes no UI package path and carries no .spec.ts references', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      uiPackage: template.indexOf('packages/web'),
      specTs: template.indexOf('.spec.ts'),
    }).toStrictEqual({ uiPackage: -1, specTs: -1 });
  });

  // The minion's FIRST action is the get-agent-prompt fetch. When it fails the minion has no
  // instructions at all, so the recovery cannot live in the prompt it failed to load — only the
  // spawn message can carry it. Observed live: the fetch failed for all six bundles, and three of
  // the four that improvised substituted the operator role and called signal-back.
  it('VALID: template => puts the prompt-fetch-failure fallback in the spawn message', () => {
    expect({
      heading: has('**Put the fetch-failure fallback in the spawn message itself, every time.**'),
      namesWhyItCannotLiveInThePrompt: has(
        'the recovery cannot live in the prompt it just failed to load',
      ),
      namesTheStaleMcpCause: has("the running MCP server's schema is older than the agent name"),
      namesTheAdvertisedTrap: has('including `flowrider`, YOUR role, whose prompt mandates'),
      literalFallbackBlock: has(
        "IF get-agent-prompt REJECTS 'flowrider-authoring-minion' (stale enum on the running MCP server):",
      ),
      tellsItToReadTheStatics: has(
        'Read packages/orchestrator/src/statics/flowrider-authoring-minion/flowrider-authoring-minion-statics.ts and follow',
      ),
      forbidsSubstitution: has("Do NOT substitute another agent name. 'flowrider' is MY role"),
      forbidsSignalBack: has('Do NOT call signal-back, ever'),
      warnsSuccessIsMeaningless: has(
        'it answers success:true\n    even for an id that matches nothing',
      ),
    }).toStrictEqual({
      heading: true,
      namesWhyItCannotLiveInThePrompt: true,
      namesTheStaleMcpCause: true,
      namesTheAdvertisedTrap: true,
      literalFallbackBlock: true,
      tellsItToReadTheStatics: true,
      forbidsSubstitution: true,
      forbidsSignalBack: true,
      warnsSuccessIsMeaningless: true,
    });
  });

  // Dispatching onto a red build hands every minion the same phantom failure to diagnose. The
  // environmental case is real: a fresh worktree fails to build for reasons that are not quest work.
  it('VALID: template => refuses to dispatch onto a red build and separates environment from work', () => {
    expect({
      doNotDispatch: has('**If that build comes back red, do not dispatch.**'),
      classifyFirst: has("A break in the quest's own code is work"),
      environmentalIsNotQuestWork: has('is not quest work: repair it and re-run'),
      namesTheCost: has('hands every\n  minion the same phantom failure to diagnose'),
      blockedIsStillBounded: has(
        'Signal `blocked` only for a wall no session of your\n  role could pass.',
      ),
    }).toStrictEqual({
      doNotDispatch: true,
      classifyFirst: true,
      environmentalIsNotQuestWork: true,
      namesTheCost: true,
      blockedIsStillBounded: true,
    });
  });

  // Minions run concurrently and ward's typecheck compiles the whole repo, so each sees the others'
  // half-finished edits. A minion cannot distinguish in-flight from pre-existing and will assert the
  // wrong one confidently; only the operator, with a still tree, can adjudicate.
  it('VALID: template => treats a minion’s "pre-existing" claim as unverified', () => {
    expect({
      heading: has('**Distrust any "pre-existing" or "unrelated" claim in an artifact.**'),
      namesTheMechanism: has("ward's typecheck compiles the whole repo regardless of file scope"),
      unverified: has('Treat every such claim as UNVERIFIED'),
      checkAfterTheTreeIsStill: has('once all bundles are back and the tree is still'),
      notAVerdict: has('"a minion said it was\npre-existing" is not a verdict'),
      decliningWasStillCorrect: has(
        'declining was\ncorrect, the diagnosis attached to it was a guess',
      ),
    }).toStrictEqual({
      heading: true,
      namesTheMechanism: true,
      unverified: true,
      checkAfterTheTreeIsStill: true,
      notAVerdict: true,
      decliningWasStillCorrect: true,
    });
  });

  // A minion that never loaded its prompt has no evidence contract, no disposition vocabulary and no
  // prohibition on signal-back or git — everything it produced needs re-reading, and the branch
  // needs checking for a commit it should never have made.
  it('VALID: template => re-reads everything from a minion whose prompt fetch failed', () => {
    expect({
      suspect: has('treat everything it produced as suspect and re-read it in full'),
      namesWhatItLacked: has(
        'it ran with no evidence\ncontract, no verdict vocabulary, and no prohibition on `signal-back` or `git`',
      ),
      checksForARogueCommit: has('check the branch\nfor a commit it should never have made'),
    }).toStrictEqual({
      suspect: true,
      namesWhatItLacked: true,
      checksForARogueCommit: true,
    });
  });

  // Every file this role and its minions write runs under Jest, so the default invocation is always
  // right. The DISCOVERY MISMATCH carve-out belongs to the role whose file set has no Jest counterpart.
  it('VALID: template => keeps the default ward invocation and offers no --only carve-out', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      alwaysHasAJestCounterpart: has('your file set always has a Jest counterpart'),
      noNarrowingNeeded: has('so narrowing it with\n`--only` is not something this role needs'),
      discoveryMismatch: template.indexOf('DISCOVERY MISMATCH'),
      narrowedInvocation: template.indexOf('`--only lint,typecheck,e2e -- <files>`'),
    }).toStrictEqual({
      alwaysHasAJestCounterpart: true,
      noNarrowingNeeded: true,
      discoveryMismatch: -1,
      narrowedInvocation: -1,
    });
  });

  // "B1 owns the comment-seeding harness" made a minion work out which file that was before it could
  // safely proceed, and two minions can reach opposite answers from the same sentence.
  it('VALID: template => names shared harness ownership by path rather than by concept', () => {
    expect({
      byFullPath: has('BY FULL PATH'),
      nameTheFile: has('Name the file, never the concept'),
      namesTheAmbiguity: has('can reach opposite answers about which file that is'),
    }).toStrictEqual({ byFullPath: true, nameTheFile: true, namesTheAmbiguity: true });
  });

  it('VALID: template => closes with numbered rules ending on the signal-back outcome', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      rules: /^## Rules$/mu.test(template),
      gitAndLedger: has('1. **Git is the state; the ledger is only whose turn it is**'),
      sliceIsTheScope: has('2. **Your SLICE is your scope**'),
      sliceLeavesSiblingUnitsAlone: has(
        'a package slice leaves the\n   seams, the seam item leaves the per-package units',
      ),
      layerPerObservable: has('5. **Match the layer to each OBSERVABLE**'),
      browserClaimIsGroundstompers: has("a claim only a\n   browser can read is Groundstomper's"),
      noSilentCaps: has('9. **No fabrication, no silent caps**'),
      trackMustBeWritten: has(
        '11. **The track must be written** — the coverage audit signs the units it settles, you sign the ones\n    you add at your own spec gate, and the outcome rides on signal-back as done|partial',
      ),
    }).toStrictEqual({
      rules: true,
      gitAndLedger: true,
      sliceIsTheScope: true,
      sliceLeavesSiblingUnitsAlone: true,
      layerPerObservable: true,
      browserClaimIsGroundstompers: true,
      noSilentCaps: true,
      trackMustBeWritten: true,
    });
  });
});
