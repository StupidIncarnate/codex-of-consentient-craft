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
});
