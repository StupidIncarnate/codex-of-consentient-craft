/**
 * PURPOSE: Names the file suffixes `gateway-import-boundary` treats as test support rather than
 * runtime — the only files a gateway package may import `@<scope>/testing` from. `.integration.test`
 * is listed even though it already ends in `.test`, matching the orchestrator ruling's own
 * four-name list.
 *
 * USAGE:
 * gatewayTestSupportSuffixStatics.suffixes;
 * // Returns ['.proxy.ts', '.test.ts', '.integration.test.ts', '.stub.ts']
 */
export const gatewayTestSupportSuffixStatics = {
  suffixes: ['.proxy.ts', '.test.ts', '.integration.test.ts', '.stub.ts'],
} as const;
