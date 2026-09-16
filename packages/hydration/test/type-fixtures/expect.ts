/**
 * PURPOSE: A type-level equality check, and the guard that turns a broken one into a compile error.
 * `Equal<A, B>` distinguishes structurally rather than by mutual assignability — the standard
 * two-function-type comparison, so `unknown` and `any` are told apart, unlike
 * `A extends B ? B extends A ? true : false : false`, which reports `true` for `any` against
 * anything. `Expect<T extends true>` accepts only the literal `true`: assigning `Expect<false>` (or
 * the widened `Expect<boolean>` a broken `Equal` degrades to) to a `true`-typed const is what makes
 * a mutation a compile error rather than a value nobody reads. Declared inside the fixture tree, not
 * `src/`, because a type-testing helper needs no `*Contract` export and no runtime carrier.
 *
 * USAGE:
 * const holds: Expect<Equal<Handles<Registry, Ingredient, 3, []>['length'], 3>> = true;
 */
export type Equal<A, B> =
  (<T>() => T extends A ? true : false) extends <T>() => T extends B ? true : false ? true : false;

export type Expect<T extends true> = T;
