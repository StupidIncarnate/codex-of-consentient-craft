/**
 * PURPOSE: The path segments the recipes package sits at in every repo siegelense runs in —
 * `packages/siegelense-recipes`. A convention rather than a config key, because the tool
 * ENUMERATES recipes before anything is seeded, and a key is one more thing to set, get wrong and
 * diverge on between repos (siegelense-tooling.md line 1982). Held here rather than in
 * `locationsStatics`, whose ban is repo-wide: a fragment as ordinary as `packages` would claim every
 * other package's unrelated use of the word. Reach for this over `recipeBookStatics` when you need
 * WHERE recipes live rather than WHICH ones exist.
 *
 * USAGE:
 * recipeLocationStatics.packageDir.segments;
 * // Returns ['packages', 'siegelense-recipes']
 */

export const recipeLocationStatics = {
  packageDir: {
    segments: ['packages', 'siegelense-recipes'],
    relative: 'packages/siegelense-recipes',
  },
} as const;
