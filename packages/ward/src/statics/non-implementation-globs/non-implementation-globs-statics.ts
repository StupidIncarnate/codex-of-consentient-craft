/**
 * PURPOSE: Glob patterns `platformCrossingCheckBroker` excludes when discovering a package's own
 * production `.ts`/`.tsx` files to start the platform-crossing walk from
 *
 * USAGE:
 * nonImplementationGlobsStatics;
 * // Returns every glob a test, proxy, stub, harness or declaration file matches
 */

export const nonImplementationGlobsStatics = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.proxy.ts',
  '**/*.proxy.tsx',
  '**/*.stub.ts',
  '**/*.harness.ts',
  '**/*.d.ts',
] as const;
