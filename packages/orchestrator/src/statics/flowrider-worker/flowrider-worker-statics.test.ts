import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';

import { flowriderWorkerStatics } from './flowrider-worker-statics';

// PROSE COMPARES IGNORE WRAPPING. `hasIn` collapses every whitespace run on BOTH sides, so a needle
// matches whichever way the template happens to wrap it.
const WHITESPACE_RUN = /\s+/gu;

const hasIn = ({ text, needle }: { text: string; needle: string }): boolean =>
  text.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

const TEMPLATE = flowriderWorkerStatics.prompt.template;

describe('flowriderWorkerStatics', () => {
  it('VALID: served template => measures below the byte ceiling', () => {
    // The budget ceiling is 50,000 bytes
    const totalLength = Buffer.byteLength(TEMPLATE, 'utf8');

    expect(totalLength).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  // THE SHARED BLOCK, WHOLE, EXACTLY ONCE. Restating it is text served twice against the same
  // budget; missing it is a rule every observable-authoring and walking prompt agreed on that this
  // prompt silently drops.
  it('VALID: served template => takes the observable-automatability block whole, exactly once', () => {
    expect(TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1).toBe(1);
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE WORKER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN script where the
  // flag applies — right beside the mark it exists to replace, at step 10 where this session actually
  // marks a unit.
  it('VALID: served template => tells the worker to flag verifyByHuman on an observable instead of cant-meet, naming the merge scope, when nothing at any layer could ever settle a unit', () => {
    expect(
      hasIn({
        needle:
          "**Where a unit resists proving at every layer you can reach, and nothing at any layer — not a later\npass, not a later spec file, nothing but a person's own judgment once the quest is done — could ever\nsettle it either: on an OBSERVABLE, set `verifyByHuman: true` on it through `modify-quest` instead\nof marking `cant-meet`, naming its flow, node and observable id — the merge only touches fields you\nsend, so nothing else on the observable needs restating.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // A TERMINAL OR BRANCH UNIT CARRIES NO verifyByHuman FIELD. `flowObservableContract` is the only
  // contract with the flag (see `observableAutomatabilityStatics`), and flowrider's own review step
  // is measured over terminal and branch units too (`stepScopeStatics.byFamilyStep.flowrider.review
  // .unitKinds`) — so a session that hit the wall on one of those needs the honest mark spelled out.
  it('VALID: served template => tells the worker a terminal or branch unit takes cant-meet with a toSettle instead, since it carries no verifyByHuman field', () => {
    expect(
      hasIn({
        needle:
          "On a terminal or branch unit, which carries\nno such field, `cant-meet` is the honest mark instead, with a `toSettle` naming the person's check.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE FALSE MERGE CLAIM IS GONE. modify-quest's deep upsert merges by id and touches only the
  // fields a call sends — it never required "carrying forward" an observable's other fields.
  it('VALID: served template => never claims the modify-quest merge requires carrying forward what an observable already declares', () => {
    expect({ carriesForwardClaimGone: TEMPLATE.includes('carrying forward what') }).toStrictEqual({
      carriesForwardClaimGone: false,
    });
  });

  // THE UNMET-UNIT SURFACE COMES FROM THE SERVED VIEW, NOT A RETIRED FIELD. `questWorkUnit.surface`
  // (`quest-work-view-contract.ts`) is what `get-quest-work`'s `assignedUnits` actually carries; a
  // prior draft named a field (`checkSurface`) that never appears on that served row.
  it("VALID: served template => tells the worker an unmet unit's surface comes from get-quest-work's assignedUnits, never a checkSurface field", () => {
    expect({
      namesTheServedField: hasIn({
        needle:
          "the surface is not yours to amend — it comes from the unit's own `surface` field on `get-quest-work`'s `assignedUnits`, and changing that is the reviewer's authority.",
        text: TEMPLATE,
      }),
      namesTheRetiredField: TEMPLATE.includes('checkSurface'),
    }).toStrictEqual({
      namesTheServedField: true,
      namesTheRetiredField: false,
    });
  });

  // THE REAL WARD RULE SURVIVES THE SUB-AGENT-BRIEF DELETION. The deleted PROVE section carried the
  // scoped-command rule alongside its stale "NEVER the run-ward MCP tool" line; step 12 is now the
  // only place this prompt states it, and the tool name must not follow it into the rewrite.
  it("VALID: served template => step 12 scopes ward to this piece's own paths, never --uncommitted, never bare, never commit, and never names run-ward", () => {
    expect({
      scopesWardToOwnPaths: hasIn({
        needle:
          "Ward your own paths only: `npm run ward -- -- <this piece's own paths>` — never `--uncommitted`, never a bare ward, and never commit.",
        text: TEMPLATE,
      }),
      namesTheRetiredTool: TEMPLATE.includes('run-ward'),
    }).toStrictEqual({
      scopesWardToOwnPaths: true,
      namesTheRetiredTool: false,
    });
  });

  // SIGNAL-BACK TAKES NO FILES. `signalBackInputContract` is `.strict()` over
  // questId/workItemId/signal/operationItemId/blockedReason — a served instruction to "signal back
  // with the uncommitted files" describes an argument the tool refuses.
  it('VALID: served template => tells the worker to call signal-back once every assigned unit carries a mark, not to hand it files', () => {
    expect({
      callsSignalBackOnMarks: hasIn({
        needle: 'Call `signal-back` once every assigned unit carries a mark.',
        text: TEMPLATE,
      }),
      claimsFilesRideSignalBack: TEMPLATE.includes('uncommitted files'),
    }).toStrictEqual({
      callsSignalBackOnMarks: true,
      claimsFilesRideSignalBack: false,
    });
  });

  // THE ONE SURVIVING SUB-AGENT RULE. The deleted DISCOVERY section's "never dispatch a sub-agent to
  // explore" line is the one rule from that block worth keeping — everything else in it (MIRROR,
  // TRAPS, DO NOT TOUCH, PROVE, RETURN) described a different session shape and is gone with it.
  it('VALID: served template => still tells the worker never to dispatch a sub-agent to explore', () => {
    expect(
      hasIn({
        needle:
          "**Never dispatch a sub-agent to explore** — exploring is how you learn the code you are about to prove, and handing it off lands what it found in someone else's summary instead of in the session writing the test.",
        text: TEMPLATE,
      }),
    ).toBe(true);
  });

  // THE LEFTOVER SUB-AGENT BRIEF IS GONE WHOLE. Not just PROVE's run-ward line: the MIRROR / TRAPS /
  // DO NOT TOUCH / DISCOVERY / RETURN headings and the "operator that briefed you" framing described
  // a sub-agent taking orders from a brief, which this worker never is.
  it('VALID: served template => drops the whole leftover sub-agent brief block (MIRROR, TRAPS, DO NOT TOUCH, RETURN headings; the operator-briefed framing)', () => {
    expect({
      hasMirrorHeading: TEMPLATE.includes('\nMIRROR\n'),
      hasTrapsHeading: TEMPLATE.includes('\nTRAPS\n'),
      hasDoNotTouchHeading: TEMPLATE.includes('\nDO NOT TOUCH\n'),
      hasReturnHeading: TEMPLATE.includes('\nRETURN\n'),
      namesOperatorBriefed: TEMPLATE.includes('the operator that briefed you'),
    }).toStrictEqual({
      hasMirrorHeading: false,
      hasTrapsHeading: false,
      hasDoNotTouchHeading: false,
      hasReturnHeading: false,
      namesOperatorBriefed: false,
    });
  });

  // BROWSER AND BELOW-BROWSER RULES STOPPED POINTING AT A SESSION MAP. "Write these into your map
  // ONCE" and "these go into your map the same way" both described a brief-writing session, not this
  // worker, which reads its own piece off get-quest-work and never maintains a map for anyone else.
  it('VALID: served template => browser and below-browser rules no longer point the worker at writing rules into a session map', () => {
    expect({
      browserMapClaim: TEMPLATE.includes('Write these into your map ONCE'),
      belowBrowserMapClaim: TEMPLATE.includes('go into your map the same way'),
    }).toStrictEqual({
      browserMapClaim: false,
      belowBrowserMapClaim: false,
    });
  });
});
