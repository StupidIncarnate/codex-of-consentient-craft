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
      priorFailure: has('walked part of a flow across a long serial run and reported'),
    }).toStrictEqual({
      heading: true,
      gateRefuses: true,
      askTheTool: true,
      priorFailure: true,
    });
  });

  it('VALID: template => lists every disposition and says all of them clear a unit', () => {
    expect({
      walked: has('| `walked` |'),
      fixed: has('| `fixed` |'),
      routed: has('| `routed` |'),
      recorded: has('| `recorded` |'),
      gap: has('| `gap` |'),
      unconfirmed: has('| `unconfirmed` |'),
      allClear: has('**Every one of these clears a unit.**'),
      refusesAbsence: has('What it refuses is a unit with NO entry at all.'),
    }).toStrictEqual({
      walked: true,
      fixed: true,
      routed: true,
      recorded: true,
      gap: true,
      unconfirmed: true,
      allClear: true,
      refusesAbsence: true,
    });
  });

  it('VALID: template => calls get-qa-checklist rather than reading the spec by hand', () => {
    expect({
      gate: /^### Gate 3: Get the Checklist \(BLOCKING\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      toolCall: has("get-qa-checklist({ questId: 'QUEST_ID', flowId: 'FLOW_ID' })"),
      doNotEnumerateByHand: has('**Do NOT read the quest spec and enumerate by hand**'),
    }).toStrictEqual({ gate: true, toolCall: true, doNotEnumerateByHand: true });
  });

  it('VALID: template => warns that paths and units are different sizes, so slicing by path under-covers', () => {
    expect({
      itineraryVsDone: has('**Paths are the ITINERARY; units are the DEFINITION OF DONE.**'),
      flatFlowTrap: has('two paths carrying twenty observables stacked on one node'),
      sliceByUnits: has('Slice by units, not by paths.'),
    }).toStrictEqual({ itineraryVsDone: true, flatFlowTrap: true, sliceByUnits: true });
  });

  it('VALID: template => collects inbound GAPs from git as its own work', () => {
    expect({
      gate: /^### Gate 2: Git, and Your Inbound GAPs \(BLOCKING\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      trustGit: has('**Trust git over the ledger.**'),
      gapsAreInbound: has('**`GAP:` lines naming YOUR flow are inbound work.**'),
      doNotRederive: has('**Do not re-derive its pass**'),
    }).toStrictEqual({
      gate: true,
      trustGit: true,
      gapsAreInbound: true,
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

  it('VALID: template => writes dispositions as it goes rather than batching to the end', () => {
    expect({
      gate: /^### Gate 8: Record Dispositions As You Go \(do NOT batch to the end\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      ledgerWrite: has('planningNotes: { qaLedger: ['),
      whyNotBatch: has('a session that dies at slice four loses every'),
      deferralNeedsDestination: has('**Deferral needs a DESTINATION.**'),
      askUserQuestionCaveat: has('does NOT apply to you.**'),
    }).toStrictEqual({
      gate: true,
      ledgerWrite: true,
      whyNotBatch: true,
      deferralNeedsDestination: true,
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
      protocol: /^## Test-Audit Minion Delegation Protocol$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
    }).toStrictEqual({ gate: true, minionName: true, parallelSafe: true, protocol: true });
  });

  it('VALID: template => ends by recomputing the checklist and letting that decide the signal', () => {
    expect({
      gate: /^### Gate 10: Ward, Teardown, Commit, Signal \(BLOCKING\)$/mu.test(
        siegemasterPromptStatics.prompt.template,
      ),
      oneLastCall: has('Call `get-qa-checklist` ONE LAST TIME'),
      numberDecides: has('your recollection, decides your signal.'),
      gateIsNotABug: has('not a bug to work around — it is the gate doing its job.'),
      allowEmpty: has('`git commit --allow-empty`'),
      noStash: has('**Hard rule — DO NOT STASH.**'),
    }).toStrictEqual({
      gate: true,
      oneLastCall: true,
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
      minionFetch: has("get-agent-prompt({ agent: 'siegemaster-minion', questId: 'QUEST_ID' })"),
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
      signalRule: has('14. **Your signal is what the checklist says, not what you remember**'),
    }).toStrictEqual({
      heading: true,
      askTheTool: true,
      freshWalkerRule: true,
      signalRule: true,
    });
  });
});
