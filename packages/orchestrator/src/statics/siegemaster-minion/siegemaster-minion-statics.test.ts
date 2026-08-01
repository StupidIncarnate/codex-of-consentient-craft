import { siegemasterMinionStatics } from './siegemaster-minion-statics';

const has = (needle: string): boolean => siegemasterMinionStatics.prompt.template.includes(needle);

describe('siegemasterMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => is substantial enough to carry the walking methodology', () => {
    expect(siegemasterMinionStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => ends with the Briefing section the operator fills, carrying $ARGUMENTS exactly once', () => {
    const { template } = siegemasterMinionStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Briefing$/mu.test(template),
      underTheHeading: has('## Briefing\n\n$ARGUMENTS'),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true, underTheHeading: true });
  });

  it('VALID: template => titles the role a bundle walker summoned by a Siegemaster operator', () => {
    expect({
      title: /^# Siegemaster-Minion - Bundle Walker$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      summonedByOperator: has(
        'You are a sub-agent summoned by a **Siegemaster operator** to hand-walk **ONE BUNDLE** of this quest',
      ),
      briefIsOnlyContext: has('**Your spawn brief is your only quest context.**'),
      inventNothing: has('If something is not in the brief, you do not know it'),
    }).toStrictEqual({
      title: true,
      summonedByOperator: true,
      briefIsOnlyContext: true,
      inventNothing: true,
    });
  });

  it('VALID: template => forbids signal-back and declares the final message IS the artifact', () => {
    const { template } = siegemasterMinionStatics.prompt;

    expect({
      noSignalBack: has('**You do NOT call `signal-back`.**'),
      artifactIsFinalMessage: has('**Your final\nmessage IS your artifact**'),
      noBackgroundWait: has('Never end your turn waiting on a background task'),
      spellsOutNoCall: template.indexOf('signal-back({'),
    }).toStrictEqual({
      noSignalBack: true,
      artifactIsFinalMessage: true,
      noBackgroundWait: true,
      spellsOutNoCall: -1,
    });
  });

  it('VALID: template => is a walker first, with evidence strictly before any fix', () => {
    const { template } = siegemasterMinionStatics.prompt;

    expect({
      walkerAndReporter: has('**You are a WALKER and a REPORTER first.**'),
      outputIsEvidence: has('Your output is evidence: what you did, what value you\nmeasured, and'),
      evidenceFirst: has('**Evidence comes before any fix**'),
      reasonIsReDriving: has(
        'a defect you have already fixed can no longer be\nre-driven in its broken state',
      ),
      mayCloseSmallHole: has('Having captured that evidence you may close a small local hole'),
      briefIsBinding: has("your brief's `FIX AUTHORITY` line, which is binding"),
      noTestsNoGit: has('You never run `git`\nand you never write tests'),
      noCommit: template.indexOf('git commit'),
    }).toStrictEqual({
      walkerAndReporter: true,
      outputIsEvidence: true,
      evidenceFirst: true,
      reasonIsReDriving: true,
      mayCloseSmallHole: true,
      briefIsBinding: true,
      noTestsNoGit: true,
      noCommit: -1,
    });
  });

  it('VALID: template => bounds its fix authority by lane, size, and reach', () => {
    expect({
      section: /^## Your Authority — Measure First, Then You May Close a Small Hole$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      recordsBrokenStateFirst: has('**Every defect starts as evidence.**'),
      operatorSendsBackUnrecorded: has(
        'a defect you fixed before recording it is a defect it cannot verify and will send\nback',
      ),
      drivingMayFix: has(
        '**On `LANE: DRIVING`, with that evidence captured, you MAY close a small local hole**',
      ),
      reWalksAfterFixing: has('re-walk the path, and report BOTH states'),
      reportsArchitectural: has('anything architectural — a new module, a changed contract'),
      reportsOutsideBundle: has('anything reaching outside your bundle'),
      readOnlyChangesNothing: has('**On `LANE: READ-ONLY` you change NO files at all**'),
      reloadIsTheReason: has(
        'The dev server reloads\non a source edit and that would derail the walker',
      ),
      unsureMeansReport: has('If you cannot\ntell whether a fix is "small", it is not: report it.'),
    }).toStrictEqual({
      section: true,
      recordsBrokenStateFirst: true,
      operatorSendsBackUnrecorded: true,
      drivingMayFix: true,
      reWalksAfterFixing: true,
      reportsArchitectural: true,
      reportsOutsideBundle: true,
      readOnlyChangesNothing: true,
      reloadIsTheReason: true,
      unsureMeansReport: true,
    });
  });

  it('VALID: template => makes every reported defect carry a fixed-or-reported disposition', () => {
    expect({
      disposition: has('DISPOSITION: FIXED BY ME | REPORTED'),
      reasonsEnumerated: has(
        'architectural / outside my bundle /\n                        needs a product decision / READ-ONLY lane / not small',
      ),
      fixedCarriesReWalk: has('the value the re-walk measured afterwards, from the'),
      fixedStillOwesATest: has('the operator still owes this a red-first test'),
    }).toStrictEqual({
      disposition: true,
      reasonsEnumerated: true,
      fixedCarriesReWalk: true,
      fixedStillOwesATest: true,
    });
  });

  it('VALID: template => branches on the brief’s LANE instead of assuming sole ownership', () => {
    expect({
      readsLaneFirst: has("**Check your brief's `LANE` line before you touch anything.**"),
      oneSystemOneDriver: has('One system means one driver: concurrent'),
      sharedState: has('share localStorage, cookies, the datastore, the queue and the temp dirs'),
      drivingLaneIsSole: has(
        '**`LANE: DRIVING`** — you are the ONLY agent touching this system right now',
      ),
      readOnlyLaneInspectsOnly: has('**`LANE: READ-ONLY`**'),
      readOnlyNeverMutates: has('Do not run the\n  reset lever, do not issue a mutating request'),
      readOnlyEscalatesInsteadOfDriving: has(
        'stop and say so in your artifact — do NOT\n  quietly drive',
      ),
      missingLaneDefaultsToDriving: has(
        'If your brief has no `LANE` line, assume DRIVING and say so in `GOTCHAS`.',
      ),
      neverRestart: has('do NOT start, restart, or stop the dev server'),
      confirmUrlOnly: has(
        '1. Confirm the Dev Server URL answers. If it does not, stop and report it — do NOT start a server.',
      ),
    }).toStrictEqual({
      readsLaneFirst: true,
      oneSystemOneDriver: true,
      sharedState: true,
      drivingLaneIsSole: true,
      readOnlyLaneInspectsOnly: true,
      readOnlyNeverMutates: true,
      readOnlyEscalatesInsteadOfDriving: true,
      missingLaneDefaultsToDriving: true,
      neverRestart: true,
      confirmUrlOnly: true,
    });
  });

  it('VALID: template => makes zero defects a good answer and forbids manufacturing a finding', () => {
    expect({
      cleanIsSuccess: has('**A clean walk is a SUCCESS.**'),
      neverManufacture: has('Do NOT manufacture a\nfinding to look productive'),
      allHeldIsWelcome: has('is a complete and welcome answer.'),
      zeroIsGood: has('DEFECTS FOUND (may be ZERO — zero is a good answer):'),
      zeroAccepted: has(
        'An artifact with a complete walk record and zero defects will be accepted as a success.',
      ),
    }).toStrictEqual({
      cleanIsSuccess: true,
      neverManufacture: true,
      allHeldIsWelcome: true,
      zeroIsGood: true,
      zeroAccepted: true,
    });
  });

  it('VALID: template => demands observation over inspection and refuses a suite re-run as a walk', () => {
    expect({
      observation: has('**Verification means OBSERVATION, not inspection.**'),
      suiteIsNotAWalk: has('**Re-running the\nexisting test suite is not a walk**'),
      readArtifactFirst: has('**Read "Your Artifact" at the bottom FIRST**'),
    }).toStrictEqual({ observation: true, suiteIsNotAWalk: true, readArtifactFirst: true });
  });

  it('VALID: template => loads the three standards tools plus discover as a blocking first step', () => {
    expect({
      step: /^## Step 1: Load Standards & Absorb the Brief \(BLOCKING — do this FIRST\)$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
      discover: has('`discover`'),
      enumerateFirst: has('**You cannot walk what you have not enumerated.**'),
    }).toStrictEqual({
      step: true,
      architecture: true,
      syntax: true,
      testing: true,
      discover: true,
      enumerateFirst: true,
    });
  });

  it('VALID: template => forms the expected value before driving anything', () => {
    expect({
      step: /^## Step 2: Learn What SHOULD Happen Before You Look$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      rationalisesOtherwise: has('An agent that looks at the page first and forms an expectation'),
    }).toStrictEqual({ step: true, rationalisesOtherwise: true });
  });

  it('VALID: template => forbids simplifying the operator’s canvas and only ever adding to it', () => {
    expect({
      step: /^## Step 3: Verify the Canvas and the Reset Lever \(DRIVING lane only\)$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      readOnlySkipsIt: has('**On `LANE: READ-ONLY`, skip this entire step**'),
      doNotSimplify: has('**Do NOT simplify the canvas.**'),
      twoOfEverything: has('The operator seeded at least two of everything an assertion must tell'),
      singleInstanceBlindness: has('single-instance benign fixture'),
      addNeverShrink: has('If you need an extra fixture, ADD to the canvas; never shrink it.'),
    }).toStrictEqual({
      step: true,
      readOnlySkipsIt: true,
      doNotSimplify: true,
      twoOfEverything: true,
      singleInstanceBlindness: true,
      addNeverShrink: true,
    });
  });

  it('VALID: template => carries the durable hidden-tab Chrome MCP knowledge with the screenshot remedy', () => {
    expect({
      section:
        /^## Driving the Browser via the Chrome MCP \(durable knowledge — do not re-derive this\)$/mu.test(
          siegemasterMinionStatics.prompt.template,
        ),
      hiddenBreaksMeasurement: has(
        '**A backgrounded or occluded tab reads `visibilityState: "hidden"`, and that BREAKS measurement.**',
      ),
      throttlesRaf: has('the browser throttles `requestAnimationFrame`'),
      clicksFallThrough: has('and clicks fall straight through to the pane behind them.'),
      notAProductBug: has('**It looks exactly like a\nproduct bug, and it is not one.**'),
      screenshotForcesFrame: has('**Taking a screenshot forces a frame and clears it.**'),
      order: has('So: screenshot\nfirst, then measure, then click.'),
      confirmBeforeReporting: has('report ANY geometry or visibility finding'),
      reMeasure: has('re-measure after a screenshot.'),
    }).toStrictEqual({
      section: true,
      hiddenBreaksMeasurement: true,
      throttlesRaf: true,
      clicksFallThrough: true,
      notAProductBug: true,
      screenshotForcesFrame: true,
      order: true,
      confirmBeforeReporting: true,
      reMeasure: true,
    });
  });

  it('VALID: template => prefers browser_batch over a sequence of single browser calls', () => {
    expect({
      batchTool: has('mcp__claude-in-chrome__browser_batch'),
      oneToolSearch: has('Load the tools in ONE `ToolSearch` call'),
      preferBatch: has(
        '**Batch your calls.** Prefer `browser_batch` over a sequence of single calls',
      ),
      latencyCost: has(
        'sequential browser calls and lost roughly nine minutes to round-trip latency alone.',
      ),
      confirmAttached: has('`tabs_context_mcp`'),
      degradedRun: has('is a DEGRADED\nrun, not a clean one'),
    }).toStrictEqual({
      batchTool: true,
      oneToolSearch: true,
      preferBatch: true,
      latencyCost: true,
      confirmAttached: true,
      degradedRun: true,
    });
  });

  it('VALID: template => reports a missing browser first so the operator can take the bundle back', () => {
    expect({
      firstLine: has('**say so as the FIRST line of your artifact**'),
      operatorMayHaveOne: has('your operator\nmay have a browser even when you do not'),
      operatorWalksItInstead: has('it takes this bundle back and walks it itself'),
      stillMarksUnconfirmed: has('Mark every `ui-state` observable UNCONFIRMED'),
      neverAnExcuse: has('"no browser" is never a way to skip the harder walk'),
    }).toStrictEqual({
      firstLine: true,
      operatorMayHaveOne: true,
      operatorWalksItInstead: true,
      stillMarksUnconfirmed: true,
      neverAnExcuse: true,
    });
  });

  it('VALID: template => requires every measurement to be capable of coming out differently', () => {
    expect(has('**Every measurement must be able to come out differently.**')).toBe(true);
  });

  it('VALID: template => resets before every path and records measured values rather than verdicts', () => {
    expect({
      step: /^## Step 4: Walk the Happy Paths$/mu.test(siegemasterMinionStatics.prompt.template),
      resetEveryPath: has('**Reset before EVERY path.**'),
      falseGreen: has(
        'a branch that passes only because prior state masked the bug is a FALSE green.',
      ),
      valueNotVerdict: has('**Record the measured value at every step**, not a verdict.'),
    }).toStrictEqual({
      step: true,
      resetEveryPath: true,
      falseGreen: true,
      valueNotVerdict: true,
    });
  });

  it('VALID: template => walks every error/skip terminal and then checks for damage', () => {
    expect({
      step: /^## Step 5: Walk the Sad Paths — Every Error\/Skip Terminal$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      happyPathOnlyIsTheFailure: has(
        '"I walked the happy path and stopped" is the number one way this job misses a',
      ),
      checkForDamage: has('**Then check for damage.**'),
    }).toStrictEqual({ step: true, happyPathOnlyIsTheFailure: true, checkForDamage: true });
  });

  it('VALID: template => checks non-DOM and custom observables where they actually live', () => {
    expect({
      step: /^## Step 6: Check the Observables That Live Off Your Drive Surface$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      neverReduceCustom: has('**Never reduce a `custom` observable to "a request fired".**'),
    }).toStrictEqual({ step: true, neverReduceCustom: true });
  });

  it('VALID: template => goes off the map and rejects a silent skip of any probe family', () => {
    expect({
      step: /^## Step 7: Go Off the Map$/mu.test(siegemasterMinionStatics.prompt.template),
      silentSkipRejected: has('A silent skip is a rejected report.'),
    }).toStrictEqual({ step: true, silentSkipRejected: true });
  });

  it('VALID: template => audits the suite only when briefed and never in place of the walk', () => {
    expect({
      step: /^## Step 8: Suite Audit — Only If Your Brief Asked, and Only After the Walk$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      neverSubstitutes: has('**It never substitutes for walk evidence.**'),
      jsdomHasNoLayout: has('where there is no layout engine and every measured width reads 0?'),
      falsePositiveGreen: has('**false-positive green**'),
    }).toStrictEqual({
      step: true,
      neverSubstitutes: true,
      jsdomHasNoLayout: true,
      falsePositiveGreen: true,
    });
  });

  it('VALID: template => self-audits its own draft for adjectives before reporting', () => {
    expect({
      step: /^## Step 9: Self-Audit Before You Report$/mu.test(
        siegemasterMinionStatics.prompt.template,
      ),
      adjectivesAreHoles: has('Every one of them is a place where a value belongs.'),
    }).toStrictEqual({ step: true, adjectivesAreHoles: true });
  });

  it('VALID: template => defines the artifact block with a BROKEN WOULD SHOW field per terminal', () => {
    expect({
      heading: /^## Your Artifact/mu.test(siegemasterMinionStatics.prompt.template),
      distilledNotTranscript: has('Return a distilled artifact, never a transcript.'),
      brokenWouldShow: has('BROKEN WOULD SHOW:'),
      rippleCandidates: has('RIPPLE CANDIDATES:'),
      unconfirmedSection: has('UNCONFIRMED / COULD NOT REACH:'),
      gotchas: has('GOTCHAS:'),
      rejectsRestatement: has(
        'Every `BROKEN WOULD SHOW` must be a concrete different value, not a restatement.',
      ),
      noValueNoMeasurement: has('you did not measure anything'),
    }).toStrictEqual({
      heading: true,
      distilledNotTranscript: true,
      brokenWouldShow: true,
      rippleCandidates: true,
      unconfirmedSection: true,
      gotchas: true,
      rejectsRestatement: true,
      noValueNoMeasurement: true,
    });
  });
});
