/**
 * PURPOSE: Single source of truth for the two track lists, held side by side because the one thing
 * neither list can state on its own is that they are different lists. `fields` names the sign-off
 * COLUMNS a verification unit carries; `denominators` names the ROLES measured over those columns.
 * They hold the same members today, and the pair is kept because the two answer different
 * questions — a denominator that shares another track's column is the shape this file exists to
 * express, and collapsing them would have to be undone the first time one lands.
 *
 * USAGE:
 * signoffTracksStatics.denominators;
 * // Returns ['codeweaver', 'flowrider', 'siegemaster'] — the tuple
 * // signoffDenominatorTrackContract builds its enum from
 * signoffTracksStatics.fields;
 * // Returns ['codeweaver', 'flowrider', 'siegemaster'] — `<name>Signoff` is the property on a unit
 *
 * Both lists are in RELAY ORDER, which is the order the roles that write them run in.
 *
 * TEST FILES READ THIS RATHER THAN THE CONTRACTS. `enforce-contract-usage-in-tests` lets a test
 * import statics and stubs but never a contract, so without a statics source every `it.each` over
 * the tracks would be a hardcoded literal that goes stale silently the day a further denominator
 * lands — and silently skipping a new member is precisely how one stays invisible.
 */

export const signoffTracksStatics = {
  fields: ['codeweaver', 'flowrider', 'siegemaster'],
  denominators: ['codeweaver', 'flowrider', 'siegemaster'],
} as const;
