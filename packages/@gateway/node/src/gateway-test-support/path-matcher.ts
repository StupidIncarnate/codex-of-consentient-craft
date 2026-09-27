/**
 * PURPOSE: The tolerant-addressing type every read-shaped fs__promises proxy's "MatchingPath"
 * methods take, declared once so proxies share it instead of each redeclaring it. An exact-match
 * method keys on the caller's real path; a "MatchingPath" method also accepts a PREDICATE, for a
 * caller whose real path is computed from a value the test does not control (a resolved cwd, a
 * joined path) — the same tolerant address the pre-gateway fs adapters offered (e.g.
 * server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's `FilePathMatcher`). Lives in
 * `gateway-test-support/`, the one folder every gateway may hold directly under `src/` that is not a
 * subpath — `gatewayReservedFolderNamesStatics.folders.testSupport` (`eslint-plugin`) names it, and
 * `gateway-node-builtin-globals` carves it out by hand, since a bare type-only helper file has no
 * real Node builtin or global to be named after (this is also why it no longer sits nested under
 * `fs__promises/`: that placement satisfied the same builtin-globals test one gateway at a time
 * instead of by one rule shared across bin, browser and node).
 *
 * USAGE:
 * import type { PathMatcher } from '../gateway-test-support/path-matcher';
 */
export type PathMatcher = string | ((value: unknown) => boolean);
