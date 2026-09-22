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
  it('VALID: template => tells the fixer to flag verifyByHuman instead of forcing a fix or marking cant-meet', () => {
    expect(
      has(
        '**Where the unit you were minted to fix resists every fix you can make, and nothing at any ' +
          'layer could ever settle it either — not a later fixer, not a later session, nothing but a ' +
          "person's own judgment once the quest is done — flag it instead of forcing a fix or marking " +
          '`cant-meet`.** Set `verifyByHuman: true` on its observable through `modify-quest`, rather ' +
          'than a `toSettle` nothing could ever carry out.',
      ),
    ).toBe(true);
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
});
