import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';
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
      lastLine: has('**Your own reading is the last line.**'),
    }).toStrictEqual({ section: true, gitIsState: true, artifactIsClaim: true, lastLine: true });
  });

  it('VALID: template => loads all three standards tools as a blocking first gate', () => {
    expect({
      blocking: has('### Gate 1: Load Project Standards (MCP — BLOCKING, do this FIRST)'),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
    }).toStrictEqual({ blocking: true, architecture: true, syntax: true, testing: true });
  });

  it('VALID: template => trusts git over the ledger when verifying its operation item', () => {
    expect(has('**Trust git over the ledger.**')).toBe(true);
  });

  it('VALID: template => requires opening test files rather than crediting a filename', () => {
    expect({
      openThem: has('**confirmed by opening the test files**'),
      neverCredit: has('Do not credit a filename.'),
      namesTheFailure: has('had opened none of them'),
    }).toStrictEqual({ openThem: true, neverCredit: true, namesTheFailure: true });
  });

  // The spec's only drift record is the ADDED:/ADJUSTED: prose in commit bodies, which Gate 2 reads.
  // quest.json is overwritten in place, carries no history field, and lives in a gitignored dir — so
  // no "as authored" version exists to compare against, and a prompt implying one sends an agent
  // hunting for a diff it cannot find.
  it('VALID: template => promises no authored-version comparison the quest cannot supply', () => {
    expect({
      noAuthoredBaseline: has('not as they were authored'),
      driftMarkersReadAtGate2: has('including `GAP:`, `ADDED:`, and\n`ADJUSTED:` notes'),
    }).toStrictEqual({ noAuthoredBaseline: false, driftMarkersReadAtGate2: true });
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

  it('VALID: template => defines a five-part evidence contract whose fourth item is the failure mode', () => {
    expect({
      contract: has('**The evidence contract.**'),
      failureMode: has('**what makes it fail**'),
      witnessedRed: has('**witnessed red output**'),
      itemFourCatchesIt: has('Item 4 catches nearly everything.'),
    }).toStrictEqual({
      contract: true,
      failureMode: true,
      witnessedRed: true,
      itemFourCatchesIt: true,
    });
  });

  it('VALID: template => rejects existence-only coverage that only name-matches observables', () => {
    expect({
      criterion: has('**Existence-only coverage.**'),
      nameMatching: has('is name-matching, not auditing'),
      notAnAudit: has('it was not an audit'),
    }).toStrictEqual({ criterion: true, nameMatching: true, notAnAudit: true });
  });

  it('VALID: template => rejects a paint claim asserted where no layout engine exists', () => {
    expect({
      criterion: has(
        '**Layer blindness — the assertion cannot observe what the observable claims.**',
      ),
      jsdomBlind: has('jsdom is worthless: jsdom has\n  no layout engine'),
      widthZero: has('every width reads 0'),
      textContent: has('proves a string is in the DOM, never that a user can read it'),
    }).toStrictEqual({
      criterion: true,
      jsdomBlind: true,
      widthZero: true,
      textContent: true,
    });
  });

  it('VALID: template => forbids stopping at the browser when a flow reaches the server', () => {
    expect({
      criterion: has('**Stopping at the browser when the flow goes deeper.**'),
      onlyWhatBrowserSees: has('Playwright can only prove what the browser\n  can observe.'),
      skippedMost: has('This is the layer minions skip most.'),
    }).toStrictEqual({ criterion: true, onlyWhatBrowserSees: true, skippedMost: true });
  });

  it('VALID: template => rejects single-instance fixtures that cannot discriminate', () => {
    expect({
      criterion: has('**Single-instance fixtures.**'),
      indistinguishable: has('"the right one"\n  and "the first one" are the same value'),
      demandTwo: has('Demand at least two, so\n  an off-by-index bug is visible.'),
    }).toStrictEqual({ criterion: true, indistinguishable: true, demandTwo: true });
  });

  it('VALID: template => rejects benign-input monoculture, vacuous negatives, and unwitnessed red', () => {
    expect({
      monoculture: has('**Benign-input monoculture.**'),
      vacuous: has('**Vacuous negatives.**'),
      unwitnessed: has('**Unwitnessed red.**'),
      selfReferential: has('**Self-referential tests.**'),
      unreachableGuard: has('**A guard for an input the product cannot produce.**'),
    }).toStrictEqual({
      monoculture: true,
      vacuous: true,
      unwitnessed: true,
      selfReferential: true,
      unreachableGuard: true,
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

  it('VALID: template => gates on a whole-quest observable ledger with one disposition each', () => {
    expect({
      gate: has('### Gate 7: The Whole-Quest Observable Ledger'),
      notASummary: has('Not a summary —\nthe actual list.'),
      covered: has('`COVERED`'),
      gap: has('`GAP:`'),
      notAnExcuse: has('It\n  is **not** a way to dispose of something you simply did not get to.'),
    }).toStrictEqual({
      gate: true,
      notASummary: true,
      covered: true,
      gap: true,
      notAnExcuse: true,
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

  it('VALID: template => makes a deliberately-red GAP test the only allowed ward failure', () => {
    expect({
      onlyAllowedRed: has(
        '**A deliberately-red test is an allowed ward failure, and the ONLY one.**',
      ),
      mostAreClosedNotLeftRed: has(
        'Most defects your testing\nexposes you close yourself (see "Your Authority")',
      ),
      redIsForHandedOnDefects: has(
        'A red\ntest is the honest record for the ones you are HANDING ON — architectural, or needing a product\ndecision',
      ),
      wasRedIsNotADisposition: has('"It was red when I got here" is not\na disposition.'),
      noForbiddenFraming: !has('You are forbidden from\nfixing implementation'),
      neverWeakenForGreen: has('Never weaken, skip,\nor delete such a test to buy a green.'),
      everyOtherRedIsYours: has('**Every OTHER red is yours to fix before you signal**'),
      includesFixableDefects: has('and a defect small enough for you to close'),
      exitCriteriaCarvesItOut: has(
        '**Exit Criteria:** Scoped ward green apart from the tests you deliberately left red',
      ),
    }).toStrictEqual({
      onlyAllowedRed: true,
      mostAreClosedNotLeftRed: true,
      redIsForHandedOnDefects: true,
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
        'omitting the flag\nalready runs all five checks (lint, typecheck, unit, integration, e2e)',
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
      noStash: has('**Hard rule — DO NOT STASH.**'),
    }).toStrictEqual({ onlyChannel: true, recordRejections: true, noStash: true });
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
      neverSignals: has('It does NOT call\n   `signal-back`; its final message IS the artifact.'),
    }).toStrictEqual({
      protocol: true,
      minionFetch: true,
      model: true,
      subagentType: true,
      neverSignals: true,
    });
  });

  it('VALID: template => makes the spawn brief the minion’s only context and quotes observables verbatim', () => {
    expect({
      onlyContext: has('**Your spawn message is the ONLY quest context it gets.**'),
      quoteNotParaphrase: has('**quote from the quest rather than paraphrasing**'),
      neverOptional: has('`ALSO FORBIDDEN` are never optional'),
      mustSatisfyVerbatim: has('- <observable-id>: "<the observable\'s description, VERBATIM>"'),
    }).toStrictEqual({
      onlyContext: true,
      quoteNotParaphrase: true,
      neverOptional: true,
      mustSatisfyVerbatim: true,
    });
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

  it('VALID: template => forbids the minion from building or writing git in the brief itself', () => {
    expect({
      forbidsBuild: has('ALSO FORBIDDEN: Do not run `npm run build`'),
      escalatesInsteadOfBuilding: has(
        'tell me in GOTCHAS if you changed implementation and I will rebuild',
      ),
      forbidsGitWrites: has(
        'Do not run\n  `git commit`, `git stash`, `git checkout` or `git reset`',
      ),
      operatorOwnsTheCommit: has('I own the single commit for this\n  session'),
      readingGitIsFine: has('Reading git is fine.'),
    }).toStrictEqual({
      forbidsBuild: true,
      escalatesInsteadOfBuilding: true,
      forbidsGitWrites: true,
      operatorOwnsTheCommit: true,
      readingGitIsFine: true,
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
      architecturalIsHandedOn: has(
        'A fix that is\n  architectural — a new module, a changed contract, a refactor spanning packages — is scope you hand\n  on, not scope you take.',
      ),
      neverBendImplementation: has('**Never bend the implementation to make a test pass.**'),
      weakeningRunBackwards: has('That is weakening a test, run backwards.'),
      neverWeaken: has('**Never weaken, skip, or delete a test to reach green**'),
      certifiesTheBreak: has('certifies the break'),
      trivialFixIsNotAGap: has('A defect you could have fixed in a\n  line is not a `GAP:`'),
      fixesGoInTheCommit: has('Every change you make beyond a test goes in your commit message'),
    }).toStrictEqual({
      doNotRebuildTheFeature: true,
      architecturalIsHandedOn: true,
      neverBendImplementation: true,
      weakeningRunBackwards: true,
      neverWeaken: true,
      certifiesTheBreak: true,
      trivialFixIsNotAGap: true,
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

  it('VALID: template => routes a product-decision defect to the user instead of burying it in prose', () => {
    expect({
      askUser: has('`ask-user-question`'),
      prosePlusLost: has('A real defect recorded only in prose gets lost'),
    }).toStrictEqual({ askUser: true, prosePlusLost: true });
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

  it('VALID: template => closes with numbered rules ending on the signal-back outcome', () => {
    const { template } = flowriderPromptStatics.prompt;

    expect({
      rules: /^## Rules$/mu.test(template),
      gitOverLedger: has('1. **Git over ledger**'),
      everyFlow: has('2. **Every flow is your scope**'),
      doneIsRight: has('`done` is the right\n    answer when your scope is complete'),
    }).toStrictEqual({
      rules: true,
      gitOverLedger: true,
      everyFlow: true,
      doneIsRight: true,
    });
  });
});
