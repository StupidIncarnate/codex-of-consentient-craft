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

  it('VALID: template => carries the $ARGUMENTS placeholder exactly once, under the Operation Context heading', () => {
    const { template } = siegemasterPromptStatics.prompt;

    expect({
      count: template.split('$ARGUMENTS').length - 1,
      ownLine: /^\$ARGUMENTS$/mu.test(template),
      heading: /^## Operation Context$/mu.test(template),
      underTheHeading: has('## Operation Context\n\n$ARGUMENTS'),
    }).toStrictEqual({ count: 1, ownLine: true, heading: true, underTheHeading: true });
  });

  it('VALID: template => embeds the shared operating rules verbatim', () => {
    expect(has(agentOperatingRulesStatics.markdown)).toBe(true);
  });

  it('VALID: template => titles the role a manual QA orchestrator owning ONE flow', () => {
    expect({
      title: /^# Siegemaster - Manual QA Orchestrator$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      ownsOneFlow: has('You own manual QA for **ONE FLOW** on this quest'),
      orchestrationLayer: has('**You are an orchestration layer.**'),
    }).toStrictEqual({ title: true, ownsOneFlow: true, orchestrationLayer: true });
  });

  it('VALID: template => delegates enumeration to the tool and walking to minions, keeping only the judgement', () => {
    expect({
      doesNotEnumerate: has('You do not enumerate the flow by hand: a tool does that.'),
      doesNotWalk: has('not walk it yourself: minions do that.'),
      evidenceOrReassurance: has('whether what came back is EVIDENCE or REASSURANCE'),
      onlyThingATooCannotDo: has('the only thing here a tool'),
    }).toStrictEqual({
      doesNotEnumerate: true,
      doesNotWalk: true,
      evidenceOrReassurance: true,
      onlyThingATooCannotDo: true,
    });
  });

  it('VALID: template => states completion is computed rather than remembered', () => {
    expect({
      heading: /^## Completion is COMPUTED, not remembered$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      gateRefuses: has("refuses `operationStatus: 'done'` while any unit on"),
      askTheTool: has('Ask the tool what is left; do not consult your memory of what you did.'),
      priorFailure: has('walked part of a flow across a long serial run\nand reported'),
    }).toStrictEqual({
      heading: true,
      gateRefuses: true,
      askTheTool: true,
      priorFailure: true,
    });
  });

  it('VALID: template => lists exactly two verdicts, both of which clear a unit', () => {
    expect({
      confirmed: has('| `confirmed` |'),
      unconfirmable: has('| `unconfirmable` |'),
      unconfirmableNeedsAQuestion: has(
        'a `question` naming what someone else would need is REQUIRED',
      ),
      bothClear: has('**Both verdicts CLEAR a unit**'),
      refusesAbsence: has('What it refuses is a\nunit with NO sign-off at all.'),
      trackIsItsOwn: has('**Your track is yours alone.**'),
      neverWritesTheOtherTrack: has(
        'Never read a\n`flowriderSignoff` as licence to skip a walk, and never write one.',
      ),
    }).toStrictEqual({
      confirmed: true,
      unconfirmable: true,
      unconfirmableNeedsAQuestion: true,
      bothClear: true,
      refusesAbsence: true,
      trackIsItsOwn: true,
      neverWritesTheOtherTrack: true,
    });
  });

  // A defect is the inverse of an observable, so it cannot be a verdict on one. Without this rule a
  // session reaches for a `gap`/`recorded` label that no longer exists and stalls at the gate.
  it('VALID: template => names all seven off-map families and routes a measured defect to a new observable', () => {
    expect({
      sevenFamilies: has(
        'seven off-map probe families — `re-entry`, `concurrency`, `interruption`, `staleness`,\n`configuration`, `hostile-input`, `perf`',
      ),
      defectIsANewObservable: has('**A defect you MEASURE is a NEW observable, not a verdict.**'),
      addedBySiegemaster: has("ADD it to the flow via `modify-quest` (`addedBy: 'siegemaster'`)"),
      noOtherVerdicts: has('There is no `gap`, `recorded`, `routed` or `deferred` verdict'),
      unclosableIsUnconfirmable: has(
        'a\ndefect you cannot close this session is an added observable sitting `unconfirmable`',
      ),
    }).toStrictEqual({
      sevenFamilies: true,
      defectIsANewObservable: true,
      addedBySiegemaster: true,
      noOtherVerdicts: true,
      unclosableIsUnconfirmable: true,
    });
  });

  // Siegemaster is the only role that runs the system, so nothing else establishes these two: a
  // static reviewer cannot prove an injection-shaped payload is rejected, and a duration only exists
  // once something is actually executed.
  it('VALID: template => gives siegemaster the security and performance charter for the quest', () => {
    expect({
      charter: has('**Security and performance are YOURS.**'),
      nobodyProvesThemStatically: has('Nobody proves them statically for this quest'),
      hostileInputOwnsSecurity: has(
        "`hostile-input` off-map family is where this quest's security is established",
      ),
      namesTheProbes: has(
        'malformed payloads,\ninjection-shaped values, oversized and empty and control-character inputs, an authorisation boundary\ndriven from the wrong side',
      ),
      perfIsMeasuredOffTheSystem: has(
        'the `perf` family is where its performance is MEASURED, off the\nrunning system, with an instrument named beside every number',
      ),
      unprobedIsUncovered: has('A concern nobody probes here is a\nconcern nobody covers at all.'),
    }).toStrictEqual({
      charter: true,
      nobodyProvesThemStatically: true,
      hostileInputOwnsSecurity: true,
      namesTheProbes: true,
      perfIsMeasuredOffTheSystem: true,
      unprobedIsUncovered: true,
    });
  });

  it('VALID: template => calls get-qa-checklist rather than reading the spec by hand', () => {
    expect({
      gate: /^### Gate 3: Get the Checklist \(BLOCKING\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      toolCall: has(
        "get-qa-checklist({ questId: 'QUEST_ID', flowId: 'FLOW_ID', track: 'siegemaster' })",
      ),
      remainingIsPerTrack: has(
        'because you passed `track` — a `remainingItemIds` measured against **your** track\nalone: every unit carrying no `siegemasterSignoff` yet',
      ),
      doNotEnumerateByHand: has('**Do NOT read the quest spec and enumerate by hand**'),
    }).toStrictEqual({
      gate: true,
      toolCall: true,
      remainingIsPerTrack: true,
      doNotEnumerateByHand: true,
    });
  });

  it('VALID: template => warns that paths and units are different sizes, so slicing by path under-covers', () => {
    expect({
      itineraryVsDone: has('**Paths are the ITINERARY; units are the DEFINITION OF DONE.**'),
      flatFlowTrap: has('two paths carrying twenty observables stacked on one node'),
      sliceByUnits: has('Slice by units, not by paths.'),
    }).toStrictEqual({ itineraryVsDone: true, flatFlowTrap: true, sliceByUnits: true });
  });

  it('VALID: template => takes the units flowrider could not settle as its own inbound work', () => {
    expect({
      gate: /^### Gate 2: Git, and What Flowrider Could Not Settle \(BLOCKING\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      trustGitForExistence: has(
        '**Trust git for what EXISTS; trust the graph for what is SETTLED.**',
      ),
      unconfirmablesAreInbound: has(
        '**An `unconfirmable` `flowriderSignoff` on your flow is inbound work.**',
      ),
      structuredNotProse: has(
        'It is a structured\n  field on the unit itself, not a string in a commit body',
      ),
      stillWalkedByHand: has('every one still gets walked by hand\n  rather than taken on trust'),
      addedByIsAReviewTarget: has('**An observable whose `addedBy` is not `spec`**'),
      doNotRederive: has('**Do not re-derive its pass**'),
    }).toStrictEqual({
      gate: true,
      trustGitForExistence: true,
      unconfirmablesAreInbound: true,
      structuredNotProse: true,
      stillWalkedByHand: true,
      addedByIsAReviewTarget: true,
      doNotRederive: true,
    });
  });

  it('VALID: template => owns the one dev server, the reset lever, a discriminating canvas, and a fault lever', () => {
    expect({
      gate: /^### Gate 5: Stand Up the System ONCE \(BLOCKING — yours alone\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      narrowCarveOut: has('**This is the ONE carve-out from Operating Rule 2, and it is narrow.**'),
      serverWontStartIsADefect: has('wall, it is your first defect'),
      leverProvenTwice: has('**Author the seed/reset lever, and prove it by using it twice.**'),
      twoOfEverything: has('least two of anything an assertion must tell apart**'),
      faultLever: has('**Consider a fault lever.**'),
    }).toStrictEqual({
      gate: true,
      narrowCarveOut: true,
      serverWontStartIsADefect: true,
      leverProvenTwice: true,
      twoOfEverything: true,
      faultLever: true,
    });
  });

  it('VALID: template => defines the convergence loop with a fresh walker verifying each fix', () => {
    expect({
      gate: /^### Gate 6: THE LOOP — dispatch, judge, record, repeat$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      dispatchFresh: has('a FRESH walker over the SAME slice.'),
      freshWalkerIsTheVerification: has(
        '**The re-walk by a fresh walker IS the verification of the fix.**',
      ),
      neverGradesItsOwn: has('it never continues past its own repair'),
      nonConvergenceGuard: has('**Guard against a loop that will not converge.**'),
    }).toStrictEqual({
      gate: true,
      dispatchFresh: true,
      freshWalkerIsTheVerification: true,
      neverGradesItsOwn: true,
      nonConvergenceGuard: true,
    });
  });

  // A sign-off written before a repair describes a system that no longer exists. Without the reset
  // the flow ships a track full of measurements of deleted behaviour, and the gate reads as green.
  it('VALID: template => resets its own track after a mid-walk fix and re-walks, leaving flowrider alone', () => {
    expect({
      resetAfterAFix: has(
        "**After a fix lands mid-walk, RESET this flow's track before you re-walk.**",
      ),
      namesWhy: has('each is now a claim about a system that no longer exists'),
      toolCall: has(
        "reset-flow-signoffs({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', flowId: 'FLOW_ID', reason: '<the fix that invalidated these walks>' })",
      ),
      scopedToOwnTrackAndFlow: has('It clears **only your track** on **only this flow**'),
      writesAWalkResetNote: has('appends a `walk-reset` note to\n`quest.planningNotes.questNotes`'),
      flowriderUntouched: has("**Flowrider's track is untouched by it**"),
      resetsAreFree: has('**Resets are FREE within a session.**'),
      costsNoPtAttempt: has('They cost no pt-chain attempt'),
    }).toStrictEqual({
      resetAfterAFix: true,
      namesWhy: true,
      toolCall: true,
      scopedToOwnTrackAndFlow: true,
      writesAWalkResetNote: true,
      flowriderUntouched: true,
      resetsAreFree: true,
      costsNoPtAttempt: true,
    });
  });

  it('VALID: template => makes judging artifacts the core job, starting with a mechanical coverage check', () => {
    expect({
      gate: /^### Gate 7: Judge Every Artifact — THIS IS YOUR CORE JOB$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      coverageFirst: has('**Coverage check first — this one is mechanical.**'),
      evidenceContract: has('**Then the evidence contract.**'),
      itemsThreeAndFour: has('Items 3 and 4 are where reports die.'),
    }).toStrictEqual({
      gate: true,
      coverageFirst: true,
      evidenceContract: true,
      itemsThreeAndFour: true,
    });
  });

  it('VALID: template => names the rejection criteria that shipped on this repo', () => {
    expect({
      adjectives: has('**Adjectives where values belong.**'),
      unfalsifiable: has('**A measurement incapable of coming out differently.**'),
      suiteInsteadOfWalk: has('**A suite run offered in place of a walk.**'),
      simplifiedCanvas: has('**A canvas the minion simplified.**'),
      customReduced: has('**A `custom` unit reduced to "a request fired".**'),
      hiddenTab: has('**A geometry or visibility finding from a hidden tab.**'),
      fixWithoutRedTest: has('**A defect reported as fixed with no red test.**'),
    }).toStrictEqual({
      adjectives: true,
      unfalsifiable: true,
      suiteInsteadOfWalk: true,
      simplifiedCanvas: true,
      customReduced: true,
      hiddenTab: true,
      fixWithoutRedTest: true,
    });
  });

  it('VALID: template => cross-checks a claimed fix against the diff and verifies by mutation', () => {
    expect({
      crossCheck: has('**Cross-check across sessions.**'),
      diffTheFile: has('can find in the working tree did not happen.'),
      verifyByMutation: has('**verify by mutation**'),
    }).toStrictEqual({ crossCheck: true, diffTheFile: true, verifyByMutation: true });
  });

  it('VALID: template => writes batched per-unit sign-offs as it goes rather than at the end', () => {
    expect({
      gate: /^### Gate 8: Record Sign-Offs As You Go \(do NOT batch to the end\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      oneCallPerArtifact: has(
        "ONE `modify-quest` call\ncarrying every sign-off from that artifact, patching the units' own elements",
      ),
      signoffWrite: has("{ id: 'OBS_1', siegemasterSignoff: { verdict: 'confirmed',"),
      unconfirmableCarriesAQuestion: has(
        "{ id: 'OBS_2', siegemasterSignoff: { verdict: 'unconfirmable',",
      ),
      offMapIdIsTheFamily: has(
        "offMapSignoffs: [{ id: 'hostile-input', siegemasterSignoff: { ... } }]",
      ),
      idPlusSignoffOnly: has(
        '**A signing element carries ONLY its `id` plus the sign-off field.**',
      ),
      transformerRejectsExtras: has('A transformer REJECTS anything\nelse on it'),
      transformerRejectsUnknownUnits: has(
        'REJECTS a sign-off written against a unit id that does not already exist',
      ),
      batchNeverDrip: has('**Batch, never drip.**'),
      whyNotBatch: has('a session that dies at slice\nfour loses every sign-off it earned'),
      findingNeedsDestination: has('**A finding needs a DESTINATION.**'),
      askUserQuestionCaveat: has('does NOT apply to you.**'),
    }).toStrictEqual({
      gate: true,
      oneCallPerArtifact: true,
      signoffWrite: true,
      unconfirmableCarriesAQuestion: true,
      offMapIdIsTheFamily: true,
      idPlusSignoffOnly: true,
      transformerRejectsExtras: true,
      transformerRejectsUnknownUnits: true,
      batchNeverDrip: true,
      whyNotBatch: true,
      findingNeedsDestination: true,
      askUserQuestionCaveat: true,
    });
  });

  it('VALID: template => dispatches the test-audit minion after the slices are clean', () => {
    expect({
      gate: /^### Gate 9: Audit the Tests the Walks Produced$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      minionName: has('`siegemaster-test-audit-minion`'),
      parallelSafe: has('These may run in PARALLEL'),
      mutationOnly: has('**They are MUTATION-ONLY and they author nothing.**'),
      authoringIsFlowriders: has(
        "Test authoring is Flowrider's lane, and a\nsession that writes a test and then grades it has graded its own homework.",
      ),
      holesBecomeNotes: has(
        "**`COVERAGE HOLES`** — a unit with no honest test. Record each as a `questNotes` entry\n  (`kind: 'out-of-scope'`, or `'open-question'` when what the test should assert is genuinely\n  unsettled)",
      ),
      defectsReenterTheLoop: has(
        '**Suspected behaviour defects** — these re-enter the walk loop like any other finding',
      ),
      noteNeverClosesAUnit: has('**A `questNotes` entry never closes a unit.**'),
      protocol: /^## Test-Audit Minion Delegation Protocol$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
    }).toStrictEqual({
      gate: true,
      minionName: true,
      parallelSafe: true,
      mutationOnly: true,
      authoringIsFlowriders: true,
      holesBecomeNotes: true,
      defectsReenterTheLoop: true,
      noteNeverClosesAUnit: true,
      protocol: true,
    });
  });

  it('VALID: template => ends by recomputing the checklist and letting that decide the signal', () => {
    expect({
      gate: /^### Gate 10: Ward, Teardown, Commit, Signal \(BLOCKING\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      oneLastCall: has("Call `get-qa-checklist` ONE LAST TIME **with `track: 'siegemaster'`**"),
      countIsPerTrack: has(
        "It is measured against your track alone — Flowrider's sign-offs neither raise nor\nlower it.",
      ),
      numberDecides: has('your recollection, decides your signal.'),
      gateIsNotABug: has('not a bug to work around — it is the gate doing its job.'),
      allowEmpty: has('`git commit --allow-empty`'),
      noStash: has('**Hard rule — DO NOT STASH.**'),
    }).toStrictEqual({
      gate: true,
      oneLastCall: true,
      countIsPerTrack: true,
      numberDecides: true,
      gateIsNotABug: true,
      allowEmpty: true,
      noStash: true,
    });
  });

  it('VALID: template => briefs walkers with a minion-fetch carrying no workItemId', () => {
    expect({
      protocol: /^## Walker Minion Delegation Protocol$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      minionFetch: has(
        "get-agent-prompt({ agent: 'siegemaster-walker-minion', questId: 'QUEST_ID' })",
      ),
      noWorkItemId: has('minion-fetch, **NO'),
      onlyContext: has('**Your spawn message is the ONLY quest context it gets.**'),
      quoteVerbatim: has('**Quote the unit text verbatim from the checklist**'),
    }).toStrictEqual({
      protocol: true,
      minionFetch: true,
      noWorkItemId: true,
      onlyContext: true,
      quoteVerbatim: true,
    });
  });

  it('VALID: template => does not restate the minion prompt inside the brief template', () => {
    expect(has('own prompt already defines how it walks')).toBe(true);
  });

  it('VALID: template => keeps every driving slice serial on the one shared server', () => {
    expect({
      serial: has('Every slice is DRIVING and therefore SERIAL unless it mutates nothing at all.'),
      whyConcurrentBreaks: has('two concurrent drivers wipe each other'),
      onlyInspectionParallel: has('Only pure inspection'),
    }).toStrictEqual({ serial: true, whyConcurrentBreaks: true, onlyInspectionParallel: true });
  });

  it('VALID: template => closes with the numbered rules recap', () => {
    expect({
      heading: /^## Rules$/mu.test(siegemasterPromptStatics.prompt.template),
      askTheTool: has('1. **Ask the tool, do not enumerate**'),
      freshWalkerRule: has('7. **A fresh walker verifies a fix, never the walker that made it**'),
      resetRule: has("12. **Reset the flow's track after a fix, then re-walk**"),
      signalRule: has(
        '15. **Your signal is the remaining count on YOUR track, not what you remember**',
      ),
    }).toStrictEqual({
      heading: true,
      askTheTool: true,
      freshWalkerRule: true,
      resetRule: true,
      signalRule: true,
    });
  });
});
