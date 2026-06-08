/**
 * PURPOSE: The focusFile path suffixes whose steps are owned by the Flowrider role rather than
 * Codeweaver — flow-perspective test suites (`.integration.test.ts`) and Playwright e2e specs
 * (`.e2e.ts`). A `.e2e.ts` path has no `src/<folderType>/` segment, so folder-type detection alone
 * misses it; the suffix check catches it. Used by isFlowriderOwnedStepGuard alongside the owned
 * folder types.
 *
 * USAGE:
 * flowTestOwnedSuffixesStatics.value;
 * // Returns ['.integration.test.ts', '.e2e.ts']
 */

export const flowTestOwnedSuffixesStatics = {
  value: ['.integration.test.ts', '.e2e.ts'],
} as const;
