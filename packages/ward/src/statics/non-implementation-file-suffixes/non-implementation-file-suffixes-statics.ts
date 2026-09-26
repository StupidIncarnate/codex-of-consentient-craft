/**
 * PURPOSE: File-name suffixes `isImplementationSourceFileGuard` treats as test support rather than
 * production code the platform-crossing walk should follow
 *
 * USAGE:
 * nonImplementationFileSuffixesStatics;
 * // Returns every suffix a proxy, stub, harness or declaration file ends in
 */

export const nonImplementationFileSuffixesStatics = [
  '.test.ts',
  '.test.tsx',
  '.proxy.ts',
  '.proxy.tsx',
  '.stub.ts',
  '.harness.ts',
  '.integration.test.ts',
  '.e2e.ts',
  '.d.ts',
] as const;
