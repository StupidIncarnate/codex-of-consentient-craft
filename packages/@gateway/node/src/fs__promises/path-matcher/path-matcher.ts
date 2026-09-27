/**
 * PURPOSE: The tolerant-addressing type every read-shaped fs__promises proxy's "MatchingPath"
 * methods take, declared once so proxies share it instead of each redeclaring it. An exact-match
 * method keys on the caller's real path; a "MatchingPath" method also accepts a PREDICATE, for a
 * caller whose real path is computed from a value the test does not control (a resolved cwd, a
 * joined path) — the same tolerant address the pre-gateway fs adapters offered (e.g.
 * server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's `FilePathMatcher`). Lives under
 * `fs__promises/`, not the package root, because `gateway-node-builtin-globals.integration.test.ts`
 * requires every folder directly under `src/` to name a real Node builtin or global.
 *
 * USAGE:
 * import type { PathMatcher } from '../path-matcher/path-matcher';
 */
export type PathMatcher = string | ((value: unknown) => boolean);
