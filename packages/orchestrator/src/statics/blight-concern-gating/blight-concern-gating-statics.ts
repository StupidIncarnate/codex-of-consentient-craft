/**
 * PURPOSE: Names the two BlightConcerns that a declaration-shaped file is structurally incapable of
 * firing, and the file kinds that count as declaration-shaped, so `blightChecklistBuildTransformer`
 * can stop minting units nobody can ever answer with a finding. Reach for this over
 * `blightChecklistLimitsStatics` — that one bounds how many units RENDER once they exist; this one
 * decides which units exist at all.
 *
 * USAGE:
 * blightConcernGatingStatics.structurallyInertConcerns;
 * // Returns the concerns withheld from a declaration-shaped file
 *
 * Measured, not guessed: across 88 review units on one real quest — a file mix dominated by exactly
 * these kinds — `perf` and `integrity` produced ZERO findings. That is a property of the question,
 * not of the reviewer. `perf` against a zod contract asks whether a schema declaration has a
 * quadratic loop; `integrity` against a brand-new file asks whether its changed exports still mean
 * to their consumers what they did, when the only consumer arrives in the same commit. Neither can
 * come back with anything but "n/a", and a unit that can only be dispositioned "n/a" costs a review
 * pass to say so.
 *
 * The other three concerns still apply to these files in full: a contract's `.refine` message can be
 * wrong (`craft`), a second contract can duplicate the first (`dedup`), and a branch added to a
 * proxy or a stub can ship with no case (`test-cases`).
 *
 * `inertImplSuffixes` are SUFFIX tests, not exact markers, so `.test.ts` already covers
 * `.integration.test.ts` and listing it separately would be a second copy of one rule.
 */

export const blightConcernGatingStatics = {
  structurallyInertConcerns: ['perf', 'integrity'],
  inertImplSuffixes: [
    '-contract.ts',
    '.stub.ts',
    '.proxy.ts',
    '.proxy.tsx',
    '.test.ts',
    '.test.tsx',
    '.e2e.ts',
    '.harness.ts',
  ],
  barrelBasename: 'index.ts',
} as const;
