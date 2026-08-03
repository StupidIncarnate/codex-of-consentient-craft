import { flowEvidenceContractStatics } from '../flow-evidence-contract/flow-evidence-contract-statics';
import { flowriderMinionStatics } from './flowrider-minion-statics';

const has = (needle: string): boolean => flowriderMinionStatics.prompt.template.includes(needle);

describe('flowriderMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(flowriderMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => carries exactly one $ARGUMENTS token on its own line', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
    }).toStrictEqual({ count: 1, ownLine: true });
  });

  it('VALID: template => ends with the Briefing section the operator fills', () => {
    expect(flowriderMinionStatics.prompt.template).toMatch(/^## Briefing$/mu);
  });

  // The minion both authors and self-audits, so it carries BOTH blocks. Embedding the operator's
  // judging criteria rather than restating them is what stops a minion being rejected against a
  // criterion it never received.
  it('VALID: template => embeds the shared judging criteria verbatim', () => {
    expect(has(flowEvidenceContractStatics.judgingMarkdown)).toBe(true);
  });

  it('VALID: template => embeds the authoring method the operator no longer carries', () => {
    expect(has(flowEvidenceContractStatics.authoringMarkdown)).toBe(true);
  });

  it('VALID: template => declares it is summoned by a Flowrider operator to cover ONE BUNDLE', () => {
    expect(
      has(
        'You are a sub-agent summoned by a **Flowrider operator** to author the flow-perspective test suite\nfor **ONE BUNDLE** of this quest',
      ),
    ).toBe(true);
  });

  it('VALID: template => forbids signal-back and declares the final message IS the artifact', () => {
    expect({
      noSignalBack: has('**You do NOT call `signal-back`. Ever.**'),
      artifactIsFinalMessage: has('**Your final message IS your artifact**'),
    }).toStrictEqual({ noSignalBack: true, artifactIsFinalMessage: true });
  });

  it('VALID: template => puts tests first without forbidding implementation changes', () => {
    expect({
      testWriterFirst: has(
        '**You are a TEST WRITER first, but you are not forbidden from touching implementation.**',
      ),
      closingIsUsuallyYours: has('closing it is usually yours to do'),
      pointsAtAuthoritySection: has("check your brief's `FIX AUTHORITY` line, which can narrow it"),
    }).toStrictEqual({
      testWriterFirst: true,
      closingIsUsuallyYours: true,
      pointsAtAuthoritySection: true,
    });
  });

  // The authoring step used to end "and you write ONLY tests", which contradicted this prompt's own
  // Your Authority section and its FIXES MADE artifact block. A minion reading it literally leaves
  // every hole it finds for a later role to re-derive.
  it('VALID: template => never tells the minion it writes only tests', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      writeOnlyTests: template.indexOf('you write ONLY tests'),
      writesNoImplementation: template.indexOf('you write no implementation'),
      completingCoverage: has('You are completing coverage, not starting it.'),
    }).toStrictEqual({
      writeOnlyTests: -1,
      writesNoImplementation: -1,
      completingCoverage: true,
    });
  });

  // The brief's LAYERS line is the operator's summary; the minion reads the code. If the minion
  // defers to the summary, a layer the operator missed goes uncovered and nobody learns of it.
  it('VALID: template => makes its own layer trace authoritative over the brief and reports misses', () => {
    expect({
      briefIsAHypothesis: has(
        "Your brief's `LAYERS THIS BUNDLE CROSSES` line is the operator's starting hypothesis, not the\nanswer.",
      ),
      ownTraceWins: has('**Your own trace is authoritative**'),
      reportsTheMiss: has('say so\nin `GOTCHAS`'),
      namesWhyOperatorNeedsIt: has(
        'the operator needs it for the whole-quest seam check that only it can run',
      ),
    }).toStrictEqual({
      briefIsAHypothesis: true,
      ownTraceWins: true,
      reportsTheMiss: true,
      namesWhyOperatorNeedsIt: true,
    });
  });

  // A flow's flowType says where its centre of gravity is, not that every observable on it is a
  // predicate. An operational flow routinely carries ui-state observables asserting the surfaces a
  // deletion was supposed to leave alone still work — abandoning those is silent lost coverage.
  it('VALID: template => picks the verification mode per observable, never per flow', () => {
    expect({
      perObservable: has('**Mode C is chosen per OBSERVABLE, never per flow.**'),
      flowTypeIsNotAVerdict: has(
        'A flow whose `flowType` is `operational` is\ntelling you where its centre of gravity sits — it is NOT telling you every observable on it is a\npredicate.',
      ),
      namesTheUiStateCase: has(
        'An operational flow routinely carries `ui-state` observables asserting that the surfaces\na deletion was supposed to leave alone still work',
      ),
      readsTheOwnType: has("Read every observable's own `type`"),
      noFlowLevelLabel: has('never let a flow-level label decide for a whole\nflow'),
    }).toStrictEqual({
      perObservable: true,
      flowTypeIsNotAVerdict: true,
      namesTheUiStateCase: true,
      readsTheOwnType: true,
      noFlowLevelLabel: true,
    });
  });

  // A browser-storage observable has no home unless a mode claims it, and the lifecycle half of the
  // claim (mount, reload, navigation) is only observable through a real page.
  it('VALID: template => routes browser-storage lifecycle observables into the Playwright mode', () => {
    expect({
      modeAClaimsCacheState: has(
        '`cache-state` observables whose claim involves a page\nlifecycle (mount, reload, navigation, a second tab)',
      ),
      modeBClaimsPersistence: has('### Mode B: Server, queue, CLI, or persistence'),
      modeCClaimsPredicates: has('### Mode C: Verification of a predicate'),
    }).toStrictEqual({
      modeAClaimsCacheState: true,
      modeBClaimsPersistence: true,
      modeCClaimsPredicates: true,
    });
  });

  it('VALID: template => requires a server-layer assertion when a flow reaches past the browser', () => {
    expect(has('**Required even when the flow also has a UI**')).toBe(true);
  });

  it('VALID: template => requires a witnessed red or a mutation proof per test', () => {
    expect({
      witnessRed: has(
        '**Watch each new test fail before you make it pass, and capture the failure output.**',
      ),
      mutationFallback: has('prove the test bites by **mutation**'),
      everyTerminal: has('**One test per path** from entry to EVERY terminal.'),
      everyBranch: has('cover ALL\n  branches, success and failure'),
      happyPathIsTheFailure: has(
        '"I covered the happy path and stopped" is the most common way this role fails.',
      ),
    }).toStrictEqual({
      witnessRed: true,
      mutationFallback: true,
      everyTerminal: true,
      everyBranch: true,
      happyPathIsTheFailure: true,
    });
  });

  it('VALID: template => forbids building at all, because concurrent siblings share one dist', () => {
    expect({
      noBuild: has('**Do NOT run `npm run build`.**'),
      operatorBuiltFirst: has(
        'Your operator built once, as its own command, before it dispatched\nyou.',
      ),
      concurrentTscNamed: has('N concurrent `tsc` runs writing\none `dist/`'),
      escalatesInsteadOfBuilding: has('put it in `GOTCHAS` and let the\noperator rebuild'),
      noBareWard: has('**Never run the bare full `npm run ward`**'),
      scopedInvocation: has('npm run ward -- -- <the files you changed>'),
      noRedundantOnly: !has('--only lint,typecheck,unit,integration,e2e'),
      explainsTheDefault: has(
        'Omitting `--only` runs all five checks (lint,\ntypecheck, unit, integration, e2e), which is what you want by default.',
      ),
    }).toStrictEqual({
      noBuild: true,
      operatorBuiltFirst: true,
      concurrentTscNamed: true,
      escalatesInsteadOfBuilding: true,
      noBareWard: true,
      scopedInvocation: true,
      noRedundantOnly: true,
      explainsTheDefault: true,
    });
  });

  it('VALID: template => forbids every git write so a sibling’s work is never captured or destroyed', () => {
    expect({
      forbidsGitWrites: has(
        '**Do NOT run `git commit`, `git stash`, or a `git checkout`/`git reset` that discards working\nchanges.**',
      ),
      operatorOwnsTheCommit: has('Your operator owns the single commit for this session'),
      namesSiblingRisk: has('a stash of yours destroys theirs'),
      readingGitIsAllowed: has('Reading git is fine'),
      staysInScopedFiles: has('**Stay inside the files your brief scoped to you.**'),
    }).toStrictEqual({
      forbidsGitWrites: true,
      operatorOwnsTheCommit: true,
      namesSiblingRisk: true,
      readingGitIsAllowed: true,
      staysInScopedFiles: true,
    });
  });

  it('VALID: template => allows only a deliberately-red handed-up test to leave scoped ward red', () => {
    expect({
      onlyAllowedRed: has(
        '**A test you deliberately left red is an allowed ward failure — and the only one.**',
      ),
      mostAreClosedNotLeftRed: has(
        'Most holes your\ntesting exposes you close yourself (see "Your Authority")',
      ),
      redIsForHandedUpDefects: has(
        "A\nred test is the correct record for the ones you are HANDING UP — architectural, outside your brief's\n`FIX AUTHORITY`, or needing a product decision",
      ),
      noForbiddenFraming: !has('you are forbidden from fixing'),
      neverWeakenForGreen: has('you must NOT weaken, skip, or delete it to buy\na green'),
      namesItOnTheWardLine: has('Name each deliberate red on your `WARD:` line'),
      everyOtherRedIsMine: has('Every OTHER red is yours to fix before you report.'),
    }).toStrictEqual({
      onlyAllowedRed: true,
      mostAreClosedNotLeftRed: true,
      redIsForHandedUpDefects: true,
      noForbiddenFraming: true,
      neverWeakenForGreen: true,
      namesItOnTheWardLine: true,
      everyOtherRedIsMine: true,
    });
  });

  it('VALID: template => points the minion at the spawn message, not the near-empty Briefing section', () => {
    expect({
      briefIsTheSpawnMessage: has('It arrived in the message that summoned you'),
      briefingSectionIsJustTheQuestId: has(
        '`## Briefing` section at the bottom of this prompt carries only the Quest ID',
      ),
      namesConcurrentSiblings: has(
        '**Sibling minions are authoring their own bundles right now, against this same working tree.**',
      ),
    }).toStrictEqual({
      briefIsTheSpawnMessage: true,
      briefingSectionIsJustTheQuestId: true,
      namesConcurrentSiblings: true,
    });
  });

  // An absent ALREADY COVERED line used to leave Step 2 with nothing to open, so the minion either
  // skipped the step or duplicated a suite that already existed.
  it('VALID: template => recovers when the brief lists no existing coverage', () => {
    expect({
      doesNotTrustAbsence: has(
        "If your brief's ALREADY COVERED line is absent or says nothing covers this bundle, do not take that\non trust either",
      ),
      discoversItself: has('`discover` the test tree beside the implementation yourself'),
      tellsTheOperator: has('note in\n`GOTCHAS` that you had to'),
      namesTheCost: has('Authoring a duplicate of a suite that already existed wastes the pass.'),
    }).toStrictEqual({
      doesNotTrustAbsence: true,
      discoversItself: true,
      tellsTheOperator: true,
      namesTheCost: true,
    });
  });

  it('VALID: template => reads the design decisions as the record of the trap behind an observable', () => {
    expect({
      readsThem: has("**Read your brief's DESIGN DECISIONS carefully.**"),
      contrast: has(
        'An observable says what to assert; its design\ndecision says what goes wrong if you assert it the easy way',
      ),
      whereTheTrapIs: has('It is where the trap is written down.'),
    }).toStrictEqual({ readsThem: true, contrast: true, whereTheTrapIs: true });
  });

  it('VALID: template => defines the artifact block with a FAILS IF field per observable', () => {
    expect({
      hasArtifactHeading: /^## Your Artifact/mu.test(flowriderMinionStatics.prompt.template),
      hasFailsIf: has('FAILS IF:'),
      hasRedSeen: has('RED SEEN:'),
      rejectsRestatement: has(
        'Every `FAILS IF` must be a concrete wrong value, not a restatement of the assertion.',
      ),
    }).toStrictEqual({
      hasArtifactHeading: true,
      hasFailsIf: true,
      hasRedSeen: true,
      rejectsRestatement: true,
    });
  });

  // A Mode C observable produces a predicate result, not a test with an assertion and a witnessed
  // red. Without its own artifact shape a correct verification reads as existence-only coverage and
  // gets rejected.
  it('VALID: template => gives a Mode C predicate observable its own artifact shape', () => {
    expect({
      predicateLine: has('PREDICATE: <the exact command or check you ran>'),
      resultLine: has(
        'RESULT:    <its real output, including the exact count where the observable names one>',
      ),
      introducedAsTheAlternative: has(
        'For a Mode C predicate observable, the same block reports the verification instead:',
      ),
    }).toStrictEqual({
      predicateLine: true,
      resultLine: true,
      introducedAsTheAlternative: true,
    });
  });

  it('VALID: template => closes a hole its testing exposed and hands up only the architectural ones', () => {
    expect({
      section: /^## Your Authority — When a Test Exposes an Implementation Hole$/mu.test(
        flowriderMinionStatics.prompt.template,
      ),
      closingIsYours: has('**That is a real finding, and closing it is usually yours to do.**'),
      fixRedFirst: has('**Fix it, red-first.**'),
      reportsFixes: has('Report the fix in your artifact\n  under `FIXES MADE`'),
      operatorChecksTheRipple: has('and it\n  will check that ripple'),
      ripplesTheFix: has(
        'check\n  every other place that same value renders or that same logic runs',
      ),
      doNotRebuild: has('**Close the hole; do not rebuild the feature.**'),
      handsUpArchitectural: has('**Hand up anything architectural.**'),
      respectsBriefBound: has("**Respect your brief's `FIX AUTHORITY` line.**"),
      neverWeaken: has('**Never weaken, skip, or delete the test to get green**'),
      neverBendImplementation: has('**never bend the implementation to make\n  a test pass.**'),
      stillNeverBuilds: has('**You still never build.**'),
    }).toStrictEqual({
      section: true,
      closingIsYours: true,
      fixRedFirst: true,
      reportsFixes: true,
      operatorChecksTheRipple: true,
      ripplesTheFix: true,
      doNotRebuild: true,
      handsUpArchitectural: true,
      respectsBriefBound: true,
      neverWeaken: true,
      neverBendImplementation: true,
      stillNeverBuilds: true,
    });
  });

  // The Authority section used to route an architectural finding to `GAP:` while the artifact
  // carried a separate DEFECTS LEFT UNFIXED block for it — two names for one thing, and a GAP: that
  // tells the next reader to hand-check something a red test already proves.
  it('VALID: template => routes a handed-up defect to DEFECTS LEFT UNFIXED, never to a GAP', () => {
    expect({
      handsUpToTheDefectBlock: has(
        'leave the test red and report it under\n  `DEFECTS LEFT UNFIXED`',
      ),
      defectBlockSaysProvenRed: has(
        "DEFECTS LEFT UNFIXED (proven red, architectural or outside my brief's FIX AUTHORITY):",
      ),
      gapBlockSaysNoTestExists: has(
        'GAPS (no layer available to me can prove this — no test exists):',
      ),
      selfAuditNamesTheDifference: has(
        'a `DEFECT:` has a red test proving it, a `GAP:` has no\ntest because no layer available to you can reach it',
      ),
    }).toStrictEqual({
      handsUpToTheDefectBlock: true,
      defectBlockSaysProvenRed: true,
      gapBlockSaysNoTestExists: true,
      selfAuditNamesTheDifference: true,
    });
  });

  // Unfinished scope banked as a GAP: reads to the operator as "covered as well as it can be", so
  // the bundle looks complete and nobody ever comes back for it.
  it('VALID: template => reports unreached scope as its own block rather than banking it in a GAP', () => {
    expect({
      notReachedBlock: has(
        'NOT REACHED (bundle scope I did not get to — neither covered nor a GAP):',
      ),
      selfAuditForbidsBanking: has('Neither is a place to put an item you simply did\nnot get to'),
      namesTheConsequence: has(
        'so your operator knows the bundle is\nunfinished rather than believing it is covered',
      ),
      // Terminals and branches are exactly what "I covered the happy path and stopped" omits, and
      // an observable-only self-audit is blind to them.
      auditsTerminalsAndBranchesToo: has(
        '**Every item the checklist returned** must leave this step with\nexactly one disposition',
      ),
      undetectableFromFilesAlone: has(
        'An empty\n`NOT REACHED` list that should not be empty is the one failure it cannot detect from your files\nalone.',
      ),
    }).toStrictEqual({
      notReachedBlock: true,
      selfAuditForbidsBanking: true,
      namesTheConsequence: true,
      auditsTerminalsAndBranchesToo: true,
      undetectableFromFilesAlone: true,
    });
  });

  it('VALID: template => splits the artifact into fixes made and defects left unfixed', () => {
    expect({
      fixesBlock: has(
        'FIXES MADE (implementation holes I closed — the operator verifies these like it verifies my tests):',
      ),
      fixesCarryWitnessedRed: has('the red I witnessed\n    before the fix'),
      fixesCarryRipple: has('every other site I checked for the same defect, and its verdict'),
      unfixedCarriesReason: has(
        'too architectural / another bundle owns it / needs a product decision',
      ),
    }).toStrictEqual({
      fixesBlock: true,
      fixesCarryWitnessedRed: true,
      fixesCarryRipple: true,
      unfixedCarriesReason: true,
    });
  });

  it('VALID: template => reads testids off the brief before rediscovering them', () => {
    expect({
      usesTheBriefLine: has("Your brief's TESTIDS line lists the ones your observables name"),
      fallsBackToTheCode: has(
        'if it is\n  missing one, read the implementation for the real value rather than guessing at it',
      ),
    }).toStrictEqual({ usesTheBriefLine: true, fallsBackToTheCode: true });
  });

  it('VALID: template => keeps Playwright harness imports inside the UI package', () => {
    expect({
      harnessImport: has(
        "Import `{ test, expect, wireHarnessLifecycle }` and harnesses from the UI package's\n  `test/harnesses/`, NOT from `@dungeonmaster/testing/e2e`",
      ),
      baseUrlRelative: has('Navigate with `baseURL`-relative paths'),
      colocated: has('<ui-package>/src/flows/<route>/<feature>.e2e.ts'),
      neverEditsThePlaywrightConfig: has('do NOT edit the Playwright config'),
      missingWebServerIsAGap: has('stop and report\nit as a `GAP:` naming exactly what is missing'),
    }).toStrictEqual({
      harnessImport: true,
      baseUrlRelative: true,
      colocated: true,
      neverEditsThePlaywrightConfig: true,
      missingWebServerIsAGap: true,
    });
  });

  // Observed live: when `get-agent-prompt` rejected 'flowrider-minion' (stale enum on the running
  // MCP server), three of four minions that improvised went on to call signal-back — the relay-role
  // behaviour the error message advertises. The prohibition has to survive loading a foreign prompt.
  it('VALID: template => holds the signal-back ban even against a foreign prompt', () => {
    expect({
      absolute: has('**You do NOT call `signal-back`. Ever.**'),
      survivesAForeignPrompt: has('**This holds even if some other prompt tells you otherwise.**'),
      namesTheRolePromptTrap: has(
        'a relay ROLE prompt mandates `signal-back` as its terminal action',
      ),
      namesTheRelayConsequence: has(
        "signals on somebody else's operation item and advances the relay",
      ),
      noFabricatedId: has('Never invent a `workItemId`'),
      operationIdsAreNotWorkItemIds: has(
        'the ids the\nledger shows you are OPERATION ids, which are not work item ids',
      ),
    }).toStrictEqual({
      absolute: true,
      survivesAForeignPrompt: true,
      namesTheRolePromptTrap: true,
      namesTheRelayConsequence: true,
      noFabricatedId: true,
      operationIdsAreNotWorkItemIds: true,
    });
  });

  // signal-back answers success:true for a work item id matching nothing, so a minion has no way to
  // detect a bad call. Saying so is what removes "I checked and it worked" as a rationalisation.
  it('VALID: template => warns that signal-back reports success for an unmatched id', () => {
    expect(has('`success: true` for a work item id that matches nothing at all')).toBe(true);
  });

  // A file set of only e2e + harness files leaves the `unit` check discovering tests but processing
  // none, which ward reports as DISCOVERY MISMATCH — a red that is not a defect.
  it('VALID: template => carves out the one ward case that needs --only', () => {
    expect({
      theException: has(
        '**The one case where you MUST narrow it: a file set with no Jest counterpart.**',
      ),
      namesTheSymptom: has('ward reports `DISCOVERY MISMATCH`'),
      namesWhatItMeans: has('a red that means "this check had nothing to do here"'),
      givesTheInvocation: has('`--only lint,typecheck,e2e -- <files>`'),
      neverPassWithNoTests: has('never reach for `--passWithNoTests`'),
      defaultIsStillAllFive: has(
        'Omitting `--only` runs all five checks (lint,\ntypecheck, unit, integration, e2e), which is what you want by default.',
      ),
    }).toStrictEqual({
      theException: true,
      namesTheSymptom: true,
      namesWhatItMeans: true,
      givesTheInvocation: true,
      neverPassWithNoTests: true,
      defaultIsStillAllFive: true,
    });
  });

  // Ward's typecheck ignores file scope and compiles the whole repo, so every minion sees every
  // sibling's half-finished edits. Two minions in the live run wrote "pre-existing unrelated
  // breakage" for a file a sibling was editing at that moment; the operator would inherit that.
  it('VALID: template => attributes a cross-package error to a sibling, never to "pre-existing"', () => {
    expect({
      heading: has('**A cross-package error is probably a sibling, not a defect.**'),
      namesTheMechanism: has(
        "Ward's typecheck ignores your file\nscope and compiles the WHOLE repo",
      ),
      forbidsThePreExistingLabel: has('**do not call it "pre-existing"**'),
      namesWhyItCannotKnow: has('you cannot tell\npre-existing from in-flight'),
      reportsItInstead: has('Report it under `GOTCHAS` as a cross-package error'),
      onlyOwnFilesAreYours: has('Only a failure in a file YOU touched is yours.'),
    }).toStrictEqual({
      heading: true,
      namesTheMechanism: true,
      forbidsThePreExistingLabel: true,
      namesWhyItCannotKnow: true,
      reportsItInstead: true,
      onlyOwnFilesAreYours: true,
    });
  });

  it('VALID: template => is substantial enough to carry the authoring methodology', () => {
    expect(flowriderMinionStatics.prompt.template.length).toBeGreaterThan(2000);
  });
});
