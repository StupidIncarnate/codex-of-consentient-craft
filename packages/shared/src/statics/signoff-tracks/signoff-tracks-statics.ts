/**
 * PURPOSE: Single source of truth for the two track lists, held side by side because the one thing
 * neither list can state on its own is that they are different lists. `fields` names the sign-off
 * COLUMNS a verification unit carries; `denominators` names the ROLES measured over those columns,
 * and carries one member more because Flowrider and Groundstomper share `flowriderSignoff` while
 * splitting the units under it by package kind.
 *
 * USAGE:
 * signoffTracksStatics.denominators;
 * // Returns ['flowrider', 'groundstomper', 'siegemaster'] — the tuple
 * // signoffDenominatorTrackContract builds its enum from
 * signoffTracksStatics.fields;
 * // Returns ['flowrider', 'siegemaster'] — `<name>Signoff` is the property on a unit
 *
 * TEST FILES READ THIS RATHER THAN THE CONTRACTS. `enforce-contract-usage-in-tests` lets a test
 * import statics and stubs but never a contract, so without a statics source every `it.each` over
 * the tracks would be a hardcoded literal that goes stale silently the day a fourth denominator
 * lands — and silently skipping the new member is precisely how groundstomper stayed invisible.
 */

export const signoffTracksStatics = {
  fields: ['flowrider', 'siegemaster'],
  denominators: ['flowrider', 'groundstomper', 'siegemaster'],
} as const;
