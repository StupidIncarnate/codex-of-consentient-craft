import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from '../observable-automatability/observable-automatability-statics';

import { siegeAdversarialFixerStatics } from './siege-adversarial-fixer-statics';

const TEMPLATE = siegeAdversarialFixerStatics.prompt.template;

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Anything measuring the real bytes reads TEMPLATE directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_TEMPLATE = TEMPLATE.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_TEMPLATE.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('siege-adversarial-fixer-statics', () => {
  it('VALID: measures strictly below maxVerbatimChars', () => {
    expect(Buffer.byteLength(siegeAdversarialFixerStatics.prompt.template, 'utf8')).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });

  // THE SHARED BLOCK, WHOLE, EXACTLY ONCE. Restating it is text served twice against the same
  // budget; missing it is a rule this whole family agreed on that this prompt silently drops.
  it('VALID: template => serves observableAutomatabilityStatics exactly once', () => {
    expect(TEMPLATE.split(observableAutomatabilityStatics.markdown).length - 1).toBe(1);
  });

  // THE ROLE-SPECIFIC SENTENCE, IN THE FIXER'S OWN TERMS. The shared block explains the flag once,
  // for every host; this prompt still owes its own reader the moment inside ITS OWN marking step
  // where the flag applies — right beside the `cant-meet` mark it exists to replace.
  it('VALID: template => tells the fixer to flag verifyByHuman on an observable instead of forcing a fix or marking cant-meet', () => {
    expect(
      has(
        '**Where the unit you were minted to fix resists every fix you can make, and nothing at any ' +
          'layer could ever settle it either — not a later fixer, not a later session, nothing but a ' +
          "person's own judgment once the quest is done: on an OBSERVABLE, set `verifyByHuman: true` " +
          'on it through `modify-quest` instead of forcing a fix or marking `cant-meet`.',
      ),
    ).toBe(true);
  });

  // AN OFF-MAP FAMILY UNIT CARRIES NO verifyByHuman FIELD. This fixer is minted off the adversarial
  // walker's own scope, which is entirely off-map
  // (`stepScopeStatics.byFamilyStep.siegemaster.adversarial.unitKinds` is `['off-map']`) — so where
  // the family unit itself, rather than a per-break observable, is what resists every fix, the
  // honest mark is spelled out by name.
  it("VALID: template => tells the fixer an off-map family unit takes cant-meet with a toSettle naming the person's check instead", () => {
    expect(
      has(
        'On an off-map family unit, which ' +
          "carries no such field, `cant-meet` is the honest mark — name the person's check as its " +
          '`toSettle`.',
      ),
    ).toBe(true);
  });

  // THE OLD "toSettle NOTHING COULD CARRY OUT" CLAIM IS GONE. A person's check IS an instruction a
  // toSettle can carry — that is exactly what unitMarkingStatics defines toSettle to be.
  it('VALID: template => never claims a toSettle is something nothing could ever carry out', () => {
    expect({
      oldClaimGone: has('rather than a `toSettle` nothing could ever carry out'),
    }).toStrictEqual({ oldClaimGone: false });
  });

  // DISCOVERABILITY: the docs tool's own overview exists and is one flag away — every prompt that
  // reaches for `docs --for <scope>` says so, beside that same instruction.
  it('VALID: template => tells the reader that bare docs, with no --for, serves the tool overview', () => {
    expect(
      has(
        'run `dungeonmaster siegelense docs --for fixing` — bare `dungeonmaster siegelense docs`, ' +
          "with no `--for`, serves the tool's own overview instead.",
      ),
    ).toBe(true);
  });

  // A MARK IS WRITTEN THROUGH quest-work, NEVER modify-quest — modify-quest is a spec edit (it sets
  // verifyByHuman on an observable), not the mark-recording surface. A prior version of this table
  // claimed `modify-quest    your marks`, which sent a fixer to the wrong tool for the one call every
  // fixer makes every time it settles a unit.
  it('VALID: tool table => quest-work carries the marks, modify-quest carries only verifyByHuman', () => {
    expect({
      questWorkCarriesMarks: has(
        'quest-work                                  observations (your marks), request, amendment, outcome',
      ),
      modifyQuestCarriesVerifyByHumanOnly: has(
        'modify-quest                                step 8, verifyByHuman only, on a unit nothing could ever settle',
      ),
      notYoursExcludesEveryOtherField: has('modify-quest on any field but verifyByHuman'),
      neverClaimsModifyQuestIsMarks: !has('modify-quest                                your marks'),
    }).toStrictEqual({
      questWorkCarriesMarks: true,
      modifyQuestCarriesVerifyByHumanOnly: true,
      notYoursExcludesEveryOtherField: true,
      neverClaimsModifyQuestIsMarks: true,
    });
  });
});
