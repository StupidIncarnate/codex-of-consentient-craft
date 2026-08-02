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

  // The operator's reject list and the minion's authoring checklist are the SAME block. Asserting
  // the whole static is embedded (rather than re-listing its criteria here) is what makes a change
  // to one side impossible to land without the other.
  it('VALID: template => embeds the shared evidence contract verbatim', () => {
    expect(has(flowEvidenceContractStatics.markdown)).toBe(true);
  });

  it('VALID: template => frames the role as an operator accountable for EVERY flow on the quest', () => {
    expect({
      ownsOneItem: has("You own ONE operation item on the quest's operations ledger"),
      coversEveryFlow: has('that item covers **EVERY flow on\nthis quest**'),
      notAssignedOne: has('You are not assigned a flow'),
      includingSeams: has('accountable for all of them, and for the seams\nbetween them'),
    }).toStrictEqual({
      ownsOneItem: true,
      coversEveryFlow: true,
      notAssignedOne: true,
      includingSeams: true,
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

  it('VALID: template => has an authority section putting git first and the artifact last', () => {
    expect({
      section: /^## What Is Authoritative/mu.test(flowriderPromptStatics.prompt.template),
      gitIsState: has('**Git is the state.**'),
      artifactIsClaim: has("**A minion's artifact is a claim, not evidence.**"),
      claimCoversFixesAndGaps: has('That covers its tests, its fixes, and its gaps\n   alike.'),
      lastLine: has('**Your own reading is the last line.**'),
    }).toStrictEqual({
      section: true,
      gitIsState: true,
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
      namesTheDefaultWindowTrap: has('more\n  commits than a default `-15` window shows'),
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
      neverCredit: has('Do not credit a\n   filename.'),
      namesTheFailure: has('had opened none of them'),
    }).toStrictEqual({ openThem: true, neverCredit: true, namesTheFailure: true });
  });

  // Hand-building the inventory from get-quest is what this replaces: on a real quest that read
  // overflows to a file and costs ~19k tokens, and a session that skims it drops a flow. The tool
  // walks the graph with no model in the loop, so it cannot summarise or paraphrase.
  it('VALID: template => sources the inventory from get-qa-checklist rather than building it by hand', () => {
    expect({
      forbidsHandBuilding: has('**Do NOT hand-build the inventory from `get-quest`.**'),
      wholeQuestCall: has('`get-qa-checklist({ questId })`'),
      omitFlowIdIsWholeQuest: has(
        'omit `flowId` and it enumerates EVERY flow on the quest, which is\nexactly your scope',
      ),
      noModelInTheLoop: has(
        'It walks the flow graph with no model in the loop, so unlike a session reading a\nspec it cannot summarise, skip a long tail, or paraphrase.',
      ),
      itemsAreTheDenominator: has('**`items` is your denominator**'),
      itemsAreWiderThanObservables: has(
        'note it is WIDER than the observables:\n  terminals and branches are units in their own right',
      ),
      surfacesTruncation: has('path enumeration hit its cap and the list is INCOMPLETE'),
    }).toStrictEqual({
      forbidsHandBuilding: true,
      wholeQuestCall: true,
      omitFlowIdIsWholeQuest: true,
      noModelInTheLoop: true,
      itemsAreTheDenominator: true,
      itemsAreWiderThanObservables: true,
      surfacesTruncation: true,
    });
  });

  // remainingItemIds is the diff against planningNotes.qaLedger, which ONLY siegemaster writes.
  // Flowrider writing into that ledger would pre-satisfy siegemaster's completion gate — the gate
  // would pass with every unit already dispositioned by a role that never walked anything.
  it('VALID: template => tells flowrider to ignore remainingItemIds and stay out of the qaLedger', () => {
    expect({
      ignoreIt: has('`remainingItemIds` — **ignore this.**'),
      namesWhoWritesTheLedger: has('which only Siegemaster writes'),
      namesTheHazard: has("writing into it would pre-satisfy Siegemaster's completion gate"),
    }).toStrictEqual({
      ignoreIt: true,
      namesWhoWritesTheLedger: true,
      namesTheHazard: true,
    });
  });

  // Design decisions carry the rationale AND a Relates-to list naming the exact observables they
  // govern — the trap an assertion is supposed to catch. Without them a minion writes the easy one.
  it('VALID: template => treats the quest design decisions as mandatory briefing material', () => {
    expect({
      mandatory: has("**The quest's design decisions**"),
      notOptional: has('they are not optional reading'),
      namesTheRelatesTo: has('`Relates to:` list naming the exact nodes and'),
      contrastsTextWithRationale: has(
        "An observable's text says what\n   to assert; its design decision says what goes wrong if you assert it the easy way.",
      ),
      namesTheFailure: has('gets the observable but not the decision writes the easy assertion'),
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
      sharedLayer: has('**Shared layer and modality**'),
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
      sizeAnchor: has('a bundle much past ~25 observables is one a minion will skim'),
      notOnePerFlow: has('prefer a handful of well-briefed bundles over one per flow'),
      bySurfaceNotByFlow: has('You are dispatching\n  by SURFACE, not by flow'),
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
      minionsMayNotBuild: has('Then forbid your minions from building.'),
      concurrentTscNamed: has('N concurrent\n  `tsc` runs writing one `dist/`'),
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
      passAChecksNaming: has('obeys the naming and colocation rules'),
      passAChecksHarnessImport: has(
        'imports its harness from the UI package rather than\nhand-rolling one',
      ),
      passBSemantic: has('**Pass B — semantic, by opening the file.**'),
      passBMandatoryCategories: has('MANDATORY for every one of these, no sampling'),
      passBCatchesLayerDisagreement: has(
        'every claim whose asserted layer disagrees with the modality table',
      ),
      namedSample: has('**named random sample of the remainder**'),
      silentCapIsALie: has(
        'A sample you do not name is a silent cap, and a silent cap reads to the next session as "all of this\nwas checked"',
      ),
    }).toStrictEqual({
      namesTheScaleProblem: true,
      passATotal: true,
      passANoExcuseToSample: true,
      passAChecksNaming: true,
      passAChecksHarnessImport: true,
      passBSemantic: true,
      passBMandatoryCategories: true,
      passBCatchesLayerDisagreement: true,
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
      redBeforeTheChange: has('confirm the red was genuinely witnessed BEFORE the change'),
      rippleIsTheOperators: has(
        'A minion sees one bundle; you see\nthe quest, so the ripple is yours to finish.',
      ),
      namesTheConsequence: has(
        "An unrippled fix is the defect you will meet again in\nSiegemaster's pass.",
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
      minionVerdictIsAProposal: has('is a proposal, not a verdict'),
      takeIt: has('**take it**'),
      passItOn: has('**pass it on**'),
      mayNotEvaporate: has('What you may not do is let it evaporate.'),
      namesTheConsequence: has('a red test then looks like a mistake instead of a finding'),
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
      liability: has('stays green against a broken implementation is\na liability'),
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

  // Retyping a full quest's rows from memory is how a session drops the ones it forgot. A set
  // difference over ids can actually be completed, and it is what catches an unbundled flow.
  it('VALID: template => assembles the ledger from artifacts and reconciles it by set difference', () => {
    expect({
      gate: has('### Gate 7: The Whole-Quest Observable Ledger'),
      assembleNotRetype: has('**Assemble it; do not retype it.**'),
      reconcileById: has('reconcile **by checklist item id** against Gate 3'),
      differenceMustBeEmpty: has('must be EMPTY'),
      // Graph-derived ids reproduce byte-identically, so re-fetching diffs against the same list
      // rather than the session's recollection of it.
      refetchRatherThanRecall: has(
        'a second call reproduces them byte-identically and you are\ndiffing against the same list, not your memory of it',
      ),
      catchesUnbundledFlow: has('it is the one that catches a flow nobody bundled'),
      // Terminals and branches are exactly what a happy-path-only suite omits, and they are
      // invisible to an observable-only reconciliation.
      includesTerminalsAndBranches: has('**Terminals and branches are units too**'),
      namesTheHappyPathFailure: has(
        '"I covered the happy path and stopped" shows up here as\nterminal ids with no disposition',
      ),
      offMapIsSiegemasters: has("Off-map families are Siegemaster's exploratory\nterritory"),
      hostileInputStaysMine: has('`hostile-input` is already your fixture rule'),
      exitIsTheDifference: has('**Exit Criteria:** The set difference is empty.'),
    }).toStrictEqual({
      gate: true,
      assembleNotRetype: true,
      reconcileById: true,
      differenceMustBeEmpty: true,
      refetchRatherThanRecall: true,
      catchesUnbundledFlow: true,
      includesTerminalsAndBranches: true,
      namesTheHappyPathFailure: true,
      offMapIsSiegemasters: true,
      hostileInputStaysMine: true,
      exitIsTheDifference: true,
    });
  });

  // GAP: (no test can reach it) and DEFECT: (a red test proves it) are opposite evidentiary states.
  // Collapsing them tells Siegemaster to hand-check something that already has a failing test.
  it('VALID: template => keeps DEFECT and GAP separate and refuses to bank unreached scope in either', () => {
    expect({
      dispositionsListed: has('`COVERED`, `DEFECT:`, `GAP:`, or `ADJUSTED:`/`ADDED:`'),
      unreachedIsRemainingScope: has(
        'A unit with no disposition is not a `GAP:` — it is remaining scope',
      ),
      unreachedForcesPartial: has('it means you signal\n`partial` and name it'),
      architecturalIsADefect: has('is scope you hand on as a `DEFECT:`, not scope you take'),
      trivialFixIsNotADefect: has(
        'A defect you could have\n  fixed in a line is not a `DEFECT:`, it is a fix you skipped.',
      ),
    }).toStrictEqual({
      dispositionsListed: true,
      unreachedIsRemainingScope: true,
      unreachedForcesPartial: true,
      architecturalIsADefect: true,
      trivialFixIsNotADefect: true,
    });
  });

  it('VALID: template => checks the cross-flow seams a per-flow session cannot see', () => {
    expect({
      bothClaim: has('**two flows both claim**'),
      mutualDeferral: has('did\n  both sides defer to each other so neither covered it?'),
      punctedToUnrunFlow: has('punted to a flow that never ran, so it exists nowhere'),
      noObservables: has('a node carrying **no observables at all**'),
      twinSurface: has('**twin surface**'),
    }).toStrictEqual({
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
        '**cover it in this same session, at a layer that can observe what\nit claims.**',
      ),
      namesTheCost: has('cost an entire extra pass'),
    }).toStrictEqual({ coverItNow: true, namesTheCost: true });
  });

  it('VALID: template => rebuilds at ward time when it or a minion changed implementation, unpiped', () => {
    expect({
      rebuildCondition: has(
        '**If you or any minion changed a file outside the test tree, rebuild first**',
      ),
      checksMinionGotchas: has("Check your minions' `GOTCHAS` for this"),
      minionsCannotBuild: has('they are forbidden from\nbuilding themselves'),
      skipWhenTestsOnly: has('If nothing but tests changed since Gate 4, skip the rebuild.'),
      neverPipe: has('Never pipe it'),
      staleDist: has('a stale `dist` produces phantom failures'),
    }).toStrictEqual({
      rebuildCondition: true,
      checksMinionGotchas: true,
      minionsCannotBuild: true,
      skipWhenTestsOnly: true,
      neverPipe: true,
      staleDist: true,
    });
  });

  it('VALID: template => makes a test left red to prove a DEFECT the only allowed ward failure', () => {
    expect({
      onlyAllowedRed: has(
        '**A test left red to prove a `DEFECT:` is an allowed ward failure, and the ONLY one.**',
      ),
      mostAreClosedNotLeftRed: has(
        'Most defects\nyour testing exposes you close yourself (see "Your Authority")',
      ),
      wasRedIsNotADisposition: has('"It was red when I got here" is not\na disposition.'),
      noForbiddenFraming: !has('You are forbidden from\nfixing implementation'),
      neverWeakenForGreen: has('Never weaken, skip, or delete such a test to buy a green.'),
      everyOtherRedIsYours: has('**Every OTHER red is yours to fix before you signal**'),
      includesFixableDefects: has('and a defect small enough for you to close'),
      exitCriteriaCarvesItOut: has(
        '**Exit Criteria:** Scoped ward green apart from the tests you deliberately left red',
      ),
    }).toStrictEqual({
      onlyAllowedRed: true,
      mostAreClosedNotLeftRed: true,
      wasRedIsNotADisposition: true,
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
        'Omitting `--only` runs all five checks (lint,\ntypecheck, unit, integration, e2e), which is what you want by default.',
      ),
      detail: has('`npm run ward -- detail <runId>`'),
      discoveredIsNotRan: has('a "discovered" file count\nis not a count of tests that ran'),
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
      protocol: /^## Flowrider-Minion Delegation Protocol$/mu.test(
        flowriderPromptStatics.prompt.template,
      ),
      minionFetch: has(
        "`get-agent-prompt({ agent: 'flowrider-minion', questId: 'QUEST_ID' })` (minion-fetch — NO\n   workItemId)",
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
        '`get-qa-checklist({ questId, flowId })` itself, once per flow in its bundle',
      ),
      namesTheTranscriptionRisk: has(
        'puts a\n   transcription error between the spec and the test',
      ),
      briefCarriesWhatToolCannot: has(
        "Your brief carries what the tool CANNOT know: why these flows group, what\n   already covers them, which harness is whose, and how far the minion's authority runs.",
      ),
      briefLine: has('YOUR CHECKLIST: call get-qa-checklist('),
      noTranscribedObservableLine: !has('- <observable-id> [<type>]:'),
    }).toStrictEqual({
      judgementContext: true,
      forbidsTranscription: true,
      minionFetchesPerFlow: true,
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
      testids: has('TESTIDS:'),
      testidsSavesNDiscoveryPasses: has('so N minions\n  do not each run the same discovery pass'),
      layers: has('LAYERS THIS BUNDLE CROSSES:'),
      alreadyCovered: has('ALREADY COVERED:'),
      alreadyCoveredHasExplicitNone: has(
        'If genuinely nothing covers this bundle, say "nothing" explicitly',
      ),
      fixtureRequirements: has('FIXTURE REQUIREMENTS:'),
      neverOptional: has(
        '`DESIGN DECISIONS`, `ALREADY COVERED` and `FIXTURE REQUIREMENTS` are never optional',
      ),
      namesTheCost: has('spends its budget on your homework instead of on assertions'),
    }).toStrictEqual({
      designDecisions: true,
      testids: true,
      testidsSavesNDiscoveryPasses: true,
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
      isAHypothesis: has('my reading, as a starting\n  hypothesis'),
      minionTraceWins: has('Your own trace is authoritative'),
      reportsTheMiss: has('report any layer I missed in GOTCHAS'),
    }).toStrictEqual({ isAHypothesis: true, minionTraceWins: true, reportsTheMiss: true });
  });

  it('VALID: template => takes no dev server and refuses to author a Playwright webServer block', () => {
    expect({
      neverTouchesOne: has('**You never touch a dev server, and you are not given one.**'),
      playwrightConfigOwnsIt: has(
        "The server an e2e run needs is declared\nin the project's Playwright config (`webServer`)",
      ),
      testsAreBaseUrlRelative: has(
        'Your tests navigate `baseURL`-relative, so they need no URL of their own.',
      ),
      siegemasterOwnsIt: has(
        "Standing a long-lived server up and driving it by hand is Siegemaster's job",
      ),
      missingWebServerIsAGap: has('record it as a `GAP:` and hand it on'),
      neverAuthorsIt: has(
        'Do not author a `webServer` block yourself and do not let a minion do it',
      ),
      namesTheParallelRace: has('two of them editing it is the last-write-wins race'),
    }).toStrictEqual({
      neverTouchesOne: true,
      playwrightConfigOwnsIt: true,
      testsAreBaseUrlRelative: true,
      siegemasterOwnsIt: true,
      missingWebServerIsAGap: true,
      neverAuthorsIt: true,
      namesTheParallelRace: true,
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
      bundleSpecificOnly: has('ALSO FORBIDDEN: <bundle-specific prohibitions only.'),
      pointsAtTheMinionPrompt: has(
        'Its own prompt already forbids `npm run build`\n  and every `git` write',
      ),
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
      namesTheHoles: has(
        'a missing guard, an unhandled branch, a wrong\ndefault, an off-by-one, an edge case the happy path never hit',
      ),
      redFirst: has('**fix it, red test first.**'),
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
      noScopeNoFlowAsksFor: has('or build\n  scope no flow asks for'),
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
      briefLine: has('FIX AUTHORITY: <what this minion may change beyond tests.'),
      defaultIsMayFix: has(
        'it MAY close a genuine\n  implementation hole its own testing exposes, red-first',
      ),
      mustReportFixes: has('must report every such change'),
      narrowable: has('Name\n  anything it must NOT touch here'),
      architecturalReported: has('an architectural fix is reported, not taken'),
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
      namesTheWedge: has('strands your work item, and wedges every role behind you'),
      carryOn: has('carry straight on to the rest of your gates'),
    }).toStrictEqual({
      askUser: true,
      prosePlusLost: true,
      overridesTheWait: true,
      namesTheWedge: true,
      carryOn: true,
    });
  });

  it('VALID: template => declares e2e Playwright-exclusive and colocated with the entry flow', () => {
    expect({
      exclusive: has('**e2e = Playwright exclusively'),
      colocated: has('<ui-package>/src/flows/<route>/<feature>.e2e.ts'),
      startsIsWhereItLives: has('Where the test STARTS is\nwhere it lives'),
      nonPlaywrightIsIntegration: has('`.integration.test.ts`'),
    }).toStrictEqual({
      exclusive: true,
      colocated: true,
      startsIsWhereItLives: true,
      nonPlaywrightIsIntegration: true,
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
        'the recovery\n   cannot live in the prompt it just failed to load',
      ),
      namesTheStaleMcpCause: has(
        'a rebuilt `dist` does\n   not reach an already-running MCP child',
      ),
      namesTheAdvertisedTrap: has('including `flowrider`, YOUR role, whose prompt\n   mandates'),
      literalFallbackBlock: has(
        "IF get-agent-prompt REJECTS 'flowrider-minion' (stale enum on the running MCP server):",
      ),
      tellsItToReadTheStatics: has(
        'Read packages/orchestrator/src/statics/flowrider-minion/flowrider-minion-statics.ts directly',
      ),
      forbidsSubstitution: has("Do NOT substitute another agent name. 'flowrider' is MY role"),
      forbidsSignalBack: has('Do NOT call signal-back under any circumstances'),
      warnsSuccessIsMeaningless: has('signal-back answers success:true even for'),
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
      classifyFirst: has('Read the failure before you classify it.'),
      environmentalIsNotQuestWork: has('is not\n  quest work: repair the environment and re-run'),
      namesTheCost: has('they will each spend their pass diagnosing your\n  problem'),
      blockedIsStillBounded: has(
        'Only signal `blocked` if the wall is genuinely one no session of your role could pass.',
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
      namesTheMechanism: has("ward's typecheck ignores file scope and compiles the whole repo"),
      unverified: has('Treat every such claim as UNVERIFIED'),
      checkAfterTheTreeIsStill: has('after all bundles are back and the\ntree is still'),
      notADisposition: has('"a minion said it was pre-existing" is not a\ndisposition'),
      decliningWasStillCorrect: has(
        'declining was correct,\nbut the diagnosis attached to it was a guess',
      ),
    }).toStrictEqual({
      heading: true,
      namesTheMechanism: true,
      unverified: true,
      checkAfterTheTreeIsStill: true,
      notADisposition: true,
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
        'a minion running without its own prompt has no evidence contract, no disposition vocabulary, and no\nprohibition on `signal-back` or `git`',
      ),
      checksForARogueCommit: has('check the branch for a commit it should never have made'),
    }).toStrictEqual({
      suspect: true,
      namesWhatItLacked: true,
      checksForARogueCommit: true,
    });
  });

  it('VALID: template => carves out the one ward case that needs --only', () => {
    expect({
      theException: has(
        '**The one case where you MUST narrow it: a file set with no Jest counterpart.**',
      ),
      namesTheSymptom: has('ward reports `DISCOVERY MISMATCH`'),
      givesTheInvocation: has('`--only lint,typecheck,e2e -- <files>`'),
      neverPassWithNoTests: has('Never reach for `--passWithNoTests`'),
    }).toStrictEqual({
      theException: true,
      namesTheSymptom: true,
      givesTheInvocation: true,
      neverPassWithNoTests: true,
    });
  });

  // "B1 owns the comment-seeding harness" made a minion work out which file that was before it could
  // safely proceed, and two minions can reach opposite answers from the same sentence.
  it('VALID: template => names shared harness ownership by path rather than by concept', () => {
    expect({
      byFullPath: has('BY FULL PATH'),
      nameTheFile: has('Name the file, never the concept'),
      namesTheAmbiguity: has('two of them can\n  reach opposite answers'),
    }).toStrictEqual({ byFullPath: true, nameTheFile: true, namesTheAmbiguity: true });
  });

  it('VALID: template => closes with numbered rules ending on the signal-back outcome', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      rules: /^## Rules$/mu.test(template),
      gitAndLedger: has(
        '1. **Git over ledger for what exists; the ledger for what your role already did**',
      ),
      everyFlow: has('2. **Every flow is your scope**'),
      modalityPerObservable: has('5. **Match the modality to each OBSERVABLE**'),
      noSilentCaps: has('11. **No fabrication, no silent caps**'),
      doneIsRight: has('`done` is the right\n    answer when your scope is complete'),
    }).toStrictEqual({
      rules: true,
      gitAndLedger: true,
      everyFlow: true,
      modalityPerObservable: true,
      noSilentCaps: true,
      doneIsRight: true,
    });
  });
});
