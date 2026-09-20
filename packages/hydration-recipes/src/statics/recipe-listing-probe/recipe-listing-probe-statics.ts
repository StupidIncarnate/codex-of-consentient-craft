/**
 * PURPOSE: Fixed input values for recipes that parse their own `inputs` at BUILD time —
 * recipes with inputs cannot produce a `Plan` for `recipesListingBuildBroker` to read
 * `runs`/`makes` off without SOME input, and the listing has no earlier step to take a real one
 * from. A probe stands in for that. It never reaches disk, a socket or a screen: a recipe's build
 * callback only assembles a `Plan` as data (`packages/hydration/CLAUDE.md` — "the chain builds;
 * it does not execute"), so nothing here is ever written or seeded. Each value is deliberately
 * unlike anything a real caller would supply — an all-zero id, a path under a directory named for
 * exactly this purpose — so a probe that somehow reached a real route would be unmistakable rather
 * than quietly indistinguishable from seed data.
 *
 * USAGE:
 * recipeListingProbeStatics.questAdvancesOneStep.guildId;
 * // Returns '00000000-0000-4000-8000-000000000000'
 */

export const recipeListingProbeStatics = {
  questAdvancesOneStep: {
    guildId: '00000000-0000-4000-8000-000000000000',
  },
  sessionSingleTurn: {
    guildPath: '/siegelense-recipes/listing-probe/never-seeded',
  },
  sessionWithNestedChain: {
    guildPath: '/siegelense-recipes/listing-probe/never-seeded',
  },
} as const;
