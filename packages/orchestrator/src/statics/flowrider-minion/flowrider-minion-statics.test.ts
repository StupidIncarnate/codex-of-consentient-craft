import { flowriderMinionStatics } from './flowrider-minion-statics';

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

  it('VALID: template => declares it is summoned by a Flowrider operator to cover ONE BUNDLE', () => {
    const needle =
      'You are a sub-agent summoned by a **Flowrider operator** to author the flow-perspective test suite\nfor **ONE BUNDLE** of this quest';
    const { template } = flowriderMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => forbids signal-back and declares the final message IS the artifact', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      noSignalBack: template.includes('**You do NOT call `signal-back`.**'),
      artifactIsFinalMessage: template.includes('**Your\nfinal message IS your artifact**'),
    }).toStrictEqual({ noSignalBack: true, artifactIsFinalMessage: true });
  });

  it('VALID: template => puts tests first without forbidding implementation changes', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      testWriterFirst: template.includes(
        '**You are a TEST WRITER first, but you are not forbidden from touching implementation.**',
      ),
      closingIsUsuallyYours: template.includes('closing it is usually yours to do'),
      pointsAtAuthoritySection: template.includes(
        "check your brief's `FIX AUTHORITY` line, which can narrow it",
      ),
    }).toStrictEqual({
      testWriterFirst: true,
      closingIsUsuallyYours: true,
      pointsAtAuthoritySection: true,
    });
  });

  it('VALID: template => requires at least two of anything an assertion must discriminate', () => {
    const needle = '**At least two of anything an assertion must discriminate.**';
    const { template } = flowriderMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => warns that jsdom cannot observe a paint claim because every width reads 0', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      noLayoutEngine: template.includes('jsdom has no layout engine'),
      widthReadsZero: template.includes('every measured width reads 0'),
      textContentIsNotPaint: template.includes(
        'cannot be proven by `textContent` (which returns the string',
      ),
    }).toStrictEqual({
      noLayoutEngine: true,
      widthReadsZero: true,
      textContentIsNotPaint: true,
    });
  });

  it('VALID: template => bans benign-input monoculture and vacuous negatives', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      monoculture: template.includes('**No benign-input monoculture.**'),
      vacuous: template.includes('**No vacuous negatives.**'),
    }).toStrictEqual({ monoculture: true, vacuous: true });
  });

  it('VALID: template => requires a witnessed red or a mutation proof per test', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      witnessRed: template.includes(
        '**Watch each new test fail before you make it pass, and capture the failure output.**',
      ),
      mutationFallback: template.includes('prove the test bites by **mutation**'),
    }).toStrictEqual({ witnessRed: true, mutationFallback: true });
  });

  it('VALID: template => forbids building at all, because concurrent siblings share one dist', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      noBuild: template.includes('**Do NOT run `npm run build`.**'),
      operatorBuiltFirst: template.includes(
        'Your operator built once, as its own command, before it dispatched\nyou',
      ),
      concurrentTscNamed: template.includes('N concurrent `tsc` runs writing one `dist/`'),
      escalatesInsteadOfBuilding: template.includes(
        'put it in `GOTCHAS` and let the operator rebuild',
      ),
      noBareWard: template.includes('**Never run the bare full `npm run ward`**'),
      scopedInvocation: template.includes('npm run ward -- -- <the files you changed>'),
      noRedundantOnly: !template.includes('--only lint,typecheck,unit,integration,e2e'),
      explainsTheDefault: template.includes(
        'omitting the flag\nalready runs all five checks (lint, typecheck, unit, integration, e2e)',
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
    const { template } = flowriderMinionStatics.prompt;

    expect({
      forbidsGitWrites: template.includes(
        '**Do NOT run `git commit`, `git stash`, or a `git checkout`/`git reset` that discards working\nchanges.**',
      ),
      operatorOwnsTheCommit: template.includes(
        'Your operator owns the single commit for this session',
      ),
      namesSiblingRisk: template.includes('a stash of yours destroys theirs'),
      readingGitIsAllowed: template.includes('Reading git is fine'),
      staysInScopedFiles: template.includes('**Stay inside the files your brief scoped to you.**'),
    }).toStrictEqual({
      forbidsGitWrites: true,
      operatorOwnsTheCommit: true,
      namesSiblingRisk: true,
      readingGitIsAllowed: true,
      staysInScopedFiles: true,
    });
  });

  it('VALID: template => allows only a deliberately-red GAP test to leave scoped ward red', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      onlyAllowedRed: template.includes(
        '**A test you deliberately left red is an allowed ward failure — and the only one.**',
      ),
      mostAreClosedNotLeftRed: template.includes(
        'Most holes your\ntesting exposes you close yourself (see "Your Authority")',
      ),
      redIsForHandedUpDefects: template.includes(
        "A\nred test is the correct record for the ones you are HANDING UP — architectural, outside your brief's\n`FIX AUTHORITY`, or needing a product decision",
      ),
      noForbiddenFraming: !template.includes('you are forbidden from fixing'),
      noStaleSectionRef: !template.includes('When a Test Exposes an Implementation Gap'),
      neverWeakenForGreen: template.includes(
        'you must NOT weaken, skip, or delete it to buy\na green',
      ),
      namesItOnTheWardLine: template.includes('Name each deliberate red on your `WARD:` line'),
      everyOtherRedIsMine: template.includes('Every OTHER red is yours to fix before you report.'),
    }).toStrictEqual({
      onlyAllowedRed: true,
      mostAreClosedNotLeftRed: true,
      redIsForHandedUpDefects: true,
      noForbiddenFraming: true,
      noStaleSectionRef: true,
      neverWeakenForGreen: true,
      namesItOnTheWardLine: true,
      everyOtherRedIsMine: true,
    });
  });

  it('VALID: template => points the minion at the spawn message, not the near-empty Briefing section', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      briefIsTheSpawnMessage: template.includes('It arrived in the message that summoned you'),
      briefingSectionIsJustTheQuestId: template.includes(
        '`## Briefing` section at the bottom of this prompt carries only the Quest ID',
      ),
      namesConcurrentSiblings: template.includes(
        '**Sibling minions are authoring their own bundles right now, against this same working tree.**',
      ),
    }).toStrictEqual({
      briefIsTheSpawnMessage: true,
      briefingSectionIsJustTheQuestId: true,
      namesConcurrentSiblings: true,
    });
  });

  it('VALID: template => defines the artifact block with a FAILS IF field per observable', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      hasArtifactHeading: /^## Your Artifact/mu.test(template),
      hasFailsIf: template.includes('FAILS IF:'),
      hasRedSeen: template.includes('RED SEEN:'),
      rejectsRestatement: template.includes(
        'Every `FAILS IF` must be a concrete wrong value, not a restatement of the assertion.',
      ),
    }).toStrictEqual({
      hasArtifactHeading: true,
      hasFailsIf: true,
      hasRedSeen: true,
      rejectsRestatement: true,
    });
  });

  it('VALID: template => requires a server-layer assertion when a flow reaches past the browser', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      browserOnlyProvesBrowser: template.includes(
        '**Playwright can only prove what the browser can observe.**',
      ),
      requiredEvenWithUi: template.includes('**Required even when the flow also has a UI**'),
    }).toStrictEqual({ browserOnlyProvesBrowser: true, requiredEvenWithUi: true });
  });

  it('VALID: template => closes a hole its testing exposed and hands up only the architectural ones', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      section: /^## Your Authority — When a Test Exposes an Implementation Hole$/mu.test(template),
      closingIsYours: template.includes(
        '**That is a real finding, and closing it is usually yours to do.**',
      ),
      fixRedFirst: template.includes('**Fix it, red-first.**'),
      reportsFixes: template.includes('Report the fix in your artifact\n  under `FIXES MADE`'),
      ripplesTheFix: template.includes(
        'check\n  every other place that same value renders or that same logic runs',
      ),
      doNotRebuild: template.includes('**Close the hole; do not rebuild the feature.**'),
      handsUpArchitectural: template.includes('**Hand up anything architectural.**'),
      respectsBriefBound: template.includes("**Respect your brief's `FIX AUTHORITY` line.**"),
      neverWeaken: template.includes('**Never weaken, skip, or delete the test to get green**'),
      neverBendImplementation: template.includes(
        '**never bend the implementation to make\n  a test pass.**',
      ),
      stillNeverBuilds: template.includes('**You still never build.**'),
    }).toStrictEqual({
      section: true,
      closingIsYours: true,
      fixRedFirst: true,
      reportsFixes: true,
      ripplesTheFix: true,
      doNotRebuild: true,
      handsUpArchitectural: true,
      respectsBriefBound: true,
      neverWeaken: true,
      neverBendImplementation: true,
      stillNeverBuilds: true,
    });
  });

  it('VALID: template => splits the artifact into fixes made and defects left unfixed', () => {
    const { template } = flowriderMinionStatics.prompt;

    expect({
      fixesBlock: template.includes(
        'FIXES MADE (implementation holes I closed — the operator verifies these like it verifies my tests):',
      ),
      fixesCarryWitnessedRed: template.includes('the red I witnessed\n    before the fix'),
      fixesCarryRipple: template.includes(
        'every other site I checked for the same defect, and its verdict',
      ),
      unfixedBlock: template.includes(
        "DEFECTS LEFT UNFIXED (architectural, or outside my brief's FIX AUTHORITY):",
      ),
      unfixedCarriesReason: template.includes(
        'too architectural / another bundle owns it / needs a product decision',
      ),
    }).toStrictEqual({
      fixesBlock: true,
      fixesCarryWitnessedRed: true,
      fixesCarryRipple: true,
      unfixedBlock: true,
      unfixedCarriesReason: true,
    });
  });

  it('VALID: template => is substantial enough to carry the authoring methodology', () => {
    expect(flowriderMinionStatics.prompt.template.length).toBeGreaterThan(2000);
  });
});
