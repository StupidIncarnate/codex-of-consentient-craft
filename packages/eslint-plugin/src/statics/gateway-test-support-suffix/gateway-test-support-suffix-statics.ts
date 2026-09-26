/**
 * PURPOSE: Names the file suffixes gateway-import-boundary and gateway-dependency-declared both
 * treat as test support rather than runtime — the only files a gateway package may import
 * `@<scope>/testing` from, and the only files gateway-dependency-declared accepts a gateway
 * dependency declared in `devDependencies` alone. `.integration.test` is listed even though it
 * already ends in `.test`, matching the orchestrator ruling's own list. `.harness.ts` is the e2e/
 * integration equivalent of a `.proxy.ts` file (see `@dungeonmaster/testing`'s harness pattern), so
 * it carries the same test-support status.
 *
 * USAGE:
 * gatewayTestSupportSuffixStatics.suffixes;
 * // Returns ['.proxy.ts', '.test.ts', '.integration.test.ts', '.stub.ts', '.harness.ts']
 */
export const gatewayTestSupportSuffixStatics = {
  suffixes: ['.proxy.ts', '.test.ts', '.integration.test.ts', '.stub.ts', '.harness.ts'],
} as const;
