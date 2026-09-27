/**
 * PURPOSE: The tolerant-addressing types every bin proxy's "Matching…" methods take, declared once so
 * every `git`/`cp`/`kill`/`lsof`/`npm` proxy shares them instead of each redeclaring its own copy. An
 * exact-match method keys on the caller's literal argv element; a "Matching…" method also accepts a
 * PREDICATE, for a caller whose real argument is computed from a value the test does not control (a
 * resolved worktree path, a generated commit message) — the same tolerant address the pre-gateway
 * adapters offered (e.g.
 * `orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.proxy.ts`'s
 * `getSpawnedArgs`/`getSpawnedCwd` read-back, generalized here into a stageable predicate).
 *
 * `ArgsMatcher` addresses the WHOLE argv array a `*-run` wrapper sends — either element-by-element
 * (an array of `ArgMatcher`, for a fixed-length call with one variable slot) or as one predicate over
 * the complete array (for a call whose length itself is not fixed, such as detecting either of two
 * literal ref names).
 *
 * USAGE:
 * import type { ArgMatcher, ArgsMatcher } from '../../arg-matcher/arg-matcher';
 * const matchesQuestBranch: ArgMatcher = (value) => String(value).startsWith('quest/');
 * const matchesEitherRef: ArgsMatcher = (args) => args[2] === 'main' || args[2] === 'master';
 */
export type ArgMatcher = string | ((value: unknown) => boolean);
export type ArgsMatcher = readonly ArgMatcher[] | ((args: readonly unknown[]) => boolean);
