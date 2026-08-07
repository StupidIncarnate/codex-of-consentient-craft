import { siegemasterWalkerMinionStatics } from './siegemaster-walker-minion-statics';

const has = (needle: string): boolean =>
  siegemasterWalkerMinionStatics.prompt.template.includes(needle);

describe('siegemasterWalkerMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterWalkerMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => is substantial enough to carry the walking methodology', () => {
    expect(siegemasterWalkerMinionStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => ends with the Briefing section carrying $ARGUMENTS exactly once', () => {
    const { template } = siegemasterWalkerMinionStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      endsWithBriefing: template.endsWith('## Briefing\n\n$ARGUMENTS'),
    }).toStrictEqual({ count: 1, endsWithBriefing: true });
  });

  it('VALID: template => titles the role a slice walker summoned by a Siegemaster orchestrator', () => {
    expect({
      title: /^# Siegemaster-Walker-Minion - Slice Walker$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      summonedByOrchestrator: has(
        'You are a sub-agent summoned by a **Siegemaster orchestrator** to hand-walk **ONE SLICE**',
      ),
      briefIsOnlyContext: has('**Your spawn brief is your only quest context.**'),
    }).toStrictEqual({
      title: true,
      summonedByOrchestrator: true,
      briefIsOnlyContext: true,
    });
  });

  it('VALID: template => forbids signal-back and declares the final message IS the artifact', () => {
    expect({
      noSignalBack: has('**You do NOT call `signal-back`.**'),
      finalMessageIsArtifact: has('**Your final message IS your artifact.**'),
    }).toStrictEqual({ noSignalBack: true, finalMessageIsArtifact: true });
  });

  it('VALID: template => forbids passing a workItemId to any MCP tool', () => {
    expect(has('**Never pass a `workItemId` to any MCP tool.**')).toBe(true);
  });

  it('VALID: template => forbids ward and background waits, because a hung minion hangs the operator', () => {
    expect({
      neverWait: has(
        '**Never end your turn waiting on a background task, and never poll for one.**',
      ),
      insideOperatorsTurn: has('Your whole turn happens INSIDE your operator'),
      doNotRunWard: has('**Do not run ward**'),
    }).toStrictEqual({ neverWait: true, insideOperatorsTurn: true, doNotRunWard: true });
  });

  it('VALID: template => makes stop-at-first-defect the shaping rule with its own section', () => {
    expect({
      heading: /^## The One Rule That Shapes Everything: STOP AT THE FIRST DEFECT$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      stopWalking: has('**STOP walking.** Do not continue the route.'),
      doNotResume: has('**Do not resume the walk after fixing.**'),
    }).toStrictEqual({ heading: true, stopWalking: true, doNotResume: true });
  });

  it('VALID: template => hands fix verification to a FRESH walker rather than the one that fixed it', () => {
    expect({
      freshWalker: has('Your operator dispatches a FRESH walker over this same slice'),
      notSelfConfirming: has('You are not the'),
      convergenceIsOperators: has('Converging is the operator'),
    }).toStrictEqual({
      freshWalker: true,
      notSelfConfirming: true,
      convergenceIsOperators: true,
    });
  });

  it('VALID: template => requires a red-first fix in a modality that can observe the defect', () => {
    expect({
      redFirst: has('**Write the failing test FIRST**'),
      jsdomNoLayout: has('**jsdom has no layout engine and every measured width reads 0**'),
      seamWantsIntegration: has('**integration** test'),
      neverWeaken: has('Never weaken, skip, or delete'),
    }).toStrictEqual({
      redFirst: true,
      jsdomNoLayout: true,
      seamWantsIntegration: true,
      neverWeaken: true,
    });
  });

  it('VALID: template => bounds what it may take versus report, defaulting to report when unsure', () => {
    expect({
      reportRatherThanTake: has('**Report rather than take:**'),
      architectural: has('anything architectural'),
      outsideSlice: has('anything reaching outside your slice'),
      unsureMeansReport: has(
        '**If you cannot tell whether a fix is small enough to take, it is not: report it and stop.**',
      ),
    }).toStrictEqual({
      reportRatherThanTake: true,
      architectural: true,
      outsideSlice: true,
      unsureMeansReport: true,
    });
  });

  it('VALID: template => treats a clean walk as success and forbids manufactured findings', () => {
    expect({
      cleanIsSuccess: has('**A clean walk is a SUCCESS.**'),
      noManufacturing: has('Do NOT manufacture a finding to look productive'),
      suiteRunIsNotAWalk: has('**Re-running the existing test suite is not a walk**'),
    }).toStrictEqual({
      cleanIsSuccess: true,
      noManufacturing: true,
      suiteRunIsNotAWalk: true,
    });
  });

  it('VALID: template => loads the three standards tools plus discover as a blocking first step', () => {
    expect({
      step: /^## Step 1: Load Standards & Absorb the Brief \(BLOCKING — do this FIRST\)$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      architecture: has('`get-architecture`'),
      syntax: has('`get-syntax-rules`'),
      testing: has('`get-testing-patterns`'),
      cannotWalkUnenumerated: has('You cannot walk what you have'),
    }).toStrictEqual({
      step: true,
      architecture: true,
      syntax: true,
      testing: true,
      cannotWalkUnenumerated: true,
    });
  });

  it('VALID: template => forms the expected value before driving anything', () => {
    expect({
      step: /^## Step 2: Learn What SHOULD Happen Before You Look$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      rationalisesOtherwise: has('An agent that looks at the page first and forms an expectation'),
    }).toStrictEqual({ step: true, rationalisesOtherwise: true });
  });

  it('VALID: template => forbids simplifying the operator canvas and only ever adding to it', () => {
    expect({
      step: /^## Step 3: Verify the Canvas and the Reset Lever$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      doNotSimplify: has('**Do NOT simplify the canvas.**'),
      addNeverShrink: has('ADD to the canvas; never shrink it.'),
      doNotStartServer: has('do NOT start a'),
    }).toStrictEqual({
      step: true,
      doNotSimplify: true,
      addNeverShrink: true,
      doNotStartServer: true,
    });
  });

  it('VALID: template => carries the hidden-tab Chrome MCP knowledge so it is never re-derived', () => {
    expect({
      section:
        /^## Driving the Browser via the Chrome MCP \(durable knowledge — do not re-derive this\)$/mu.test(
          siegemasterWalkerMinionStatics.prompt.template,
        ),
      hiddenBreaksMeasurement: has(
        '**A backgrounded or occluded tab reads `visibilityState: "hidden"`, and that BREAKS measurement.**',
      ),
      screenshotForcesFrame: has('Taking a screenshot forces a frame and clears'),
      batchCalls: has('**Batch your calls.**'),
      mustBeFalsifiable: has('**Every measurement must be able to come out differently.**'),
    }).toStrictEqual({
      section: true,
      hiddenBreaksMeasurement: true,
      screenshotForcesFrame: true,
      batchCalls: true,
      mustBeFalsifiable: true,
    });
  });

  it('VALID: template => gives the perf off-map family a measurement methodology, not just falsifiability', () => {
    expect({
      section: /^## Measuring Performance \(the `perf` off-map family\)$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      numberPlusInstrument: has(
        'A performance claim is a NUMBER with an INSTRUMENT beside it. Neither one alone is evidence.',
      ),
      reportTheSecondRun: has(
        '**Measure the same action at least TWICE and report the SECOND number.**',
      ),
      namesTheInstrument: has('**Name what you measured it WITH**'),
      countsOneAction: has('**Count the requests or queries ONE user action fires**'),
      countTrackingRowsIsTheFinding: has(
        '**A count that tracks the row count IS the finding, whatever',
      ),
      realisticVolume: has('**Use a realistic data volume.**'),
      oneRowIsUnconfirmable: has(
        '**unconfirmable**: report it `NOT REACHED` naming the volume you had, never `HELD`.',
      ),
      brokenWouldShow: has('**State the number a broken system would have produced**'),
    }).toStrictEqual({
      section: true,
      numberPlusInstrument: true,
      reportTheSecondRun: true,
      namesTheInstrument: true,
      countsOneAction: true,
      countTrackingRowsIsTheFinding: true,
      realisticVolume: true,
      oneRowIsUnconfirmable: true,
      brokenWouldShow: true,
    });
  });

  it('VALID: template => resets before every path and records measured values rather than verdicts', () => {
    expect({
      step: /^## Step 4: Walk the Slice$/mu.test(siegemasterWalkerMinionStatics.prompt.template),
      resetEveryPath: has('**Reset before EVERY path.**'),
      falseGreen: has(
        'a branch that passes only because prior state masked the bug is a FALSE green',
      ),
      measuredNotVerdict: has('**Record the measured value at every step**, not a verdict.'),
    }).toStrictEqual({
      step: true,
      resetEveryPath: true,
      falseGreen: true,
      measuredNotVerdict: true,
    });
  });

  it('VALID: template => forces sad paths and checks them for damage', () => {
    expect({
      forceEveryBranch: has('**Force every branch your brief names, and reach every terminal'),
      damageCheck: has('**After any error branch, check for damage.**'),
      faultLever: has('use the **FAULT LEVER** from your brief'),
    }).toStrictEqual({ forceEveryBranch: true, damageCheck: true, faultLever: true });
  });

  it('VALID: template => checks non-DOM and custom units where they actually live', () => {
    expect({
      offDriveSurface: has('**Check units off your drive surface where they actually live.**'),
      neverReduceCustom: has('**Never reduce a `custom` unit to "a request fired".**'),
      staticCheckException: has('a unit whose own text names a'),
    }).toStrictEqual({
      offDriveSurface: true,
      neverReduceCustom: true,
      staticCheckException: true,
    });
  });

  it('VALID: template => rejects a silent skip of an off-map unit', () => {
    expect(has('A silent skip is a rejected report.')).toBe(true);
  });

  it('VALID: template => self-audits its own draft for adjectives before reporting', () => {
    expect({
      step: /^## Step 5: Self-Audit Before You Report$/mu.test(
        siegemasterWalkerMinionStatics.prompt.template,
      ),
      adjectivesAreHoles: has('Every one is a place where a value belongs.'),
    }).toStrictEqual({ step: true, adjectivesAreHoles: true });
  });

  it('VALID: template => defines the artifact with an OUTCOME, per-unit evidence, and at most one defect', () => {
    expect({
      heading: /^## Your Artifact/mu.test(siegemasterWalkerMinionStatics.prompt.template),
      distilledNotTranscript: has('Return a distilled artifact, never a transcript.'),
      outcomeLine: has('OUTCOME: CLEAN (walked the whole slice, nothing found) | DEFECT'),
      canvasConformance: has('CANVAS AS BRIEFED: yes | added <what> | shrank <what, and why>'),
      brokenWouldShow: has('BROKEN WOULD SHOW:'),
      atMostOneDefect: has('there is at most ONE, because I stop'),
      redTestField: has('RED TEST:'),
      rippleCandidates: has('RIPPLE CANDIDATES:'),
      inboundUnconfirmables: has('INBOUND UNCONFIRMABLES SETTLED:'),
    }).toStrictEqual({
      heading: true,
      distilledNotTranscript: true,
      outcomeLine: true,
      canvasConformance: true,
      brokenWouldShow: true,
      atMostOneDefect: true,
      redTestField: true,
      rippleCandidates: true,
      inboundUnconfirmables: true,
    });
  });

  // A fix invalidates every sign-off already written on the flow, because each was measured against
  // the code before the repair. The operator resets its own track and re-walks — but only if it
  // knows what moved, which is the one thing it cannot reconstruct from the diff alone.
  it('VALID: template => explains the operator track reset a mid-walk fix forces, and never calls it itself', () => {
    expect({
      fixInvalidatesSignoffs: has(
        '**Your fix also invalidates sign-offs that already exist, and the operator undoes them for you.**',
      ),
      measuredBeforeTheChange: has('was measured against the code as\nit stood BEFORE it'),
      namesTheTool: has('`reset-flow-signoffs({ questId, workItemId, flowId, reason })`'),
      clearsOnlyItsOwnTrack: has(
        "which clears its own track on this\nflow, appends a `walk-reset` note, and leaves Flowrider's track alone",
      ),
      minionNeverCallsIt: has(
        '**You\nnever call that tool**: it takes a `workItemId`, and you have none.',
      ),
      reportsWhatMoved: has('which already-walked\nbehaviour your change could have moved'),
      resetIsCheap: has(
        'A reset costs the operator nothing; a silent behaviour change\ncosts it a flow',
      ),
    }).toStrictEqual({
      fixInvalidatesSignoffs: true,
      measuredBeforeTheChange: true,
      namesTheTool: true,
      clearsOnlyItsOwnTrack: true,
      minionNeverCallsIt: true,
      reportsWhatMoved: true,
      resetIsCheap: true,
    });
  });

  it('VALID: template => never runs git, because the operator owns the commit', () => {
    expect(has('**You never run `git`.** Your operator owns the commit.')).toBe(true);
  });
});
