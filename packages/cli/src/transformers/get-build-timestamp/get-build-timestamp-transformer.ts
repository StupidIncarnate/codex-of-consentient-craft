/**
 * PURPOSE: Retrieves the build timestamp injected at bundle time by esbuild
 *
 * USAGE:
 * getBuildTimestampTransformer();
 * // Returns 'Jan 30 2:45 PM' or 'dev' if not bundled
 */

declare const __BUILD_TIMESTAMP__: string;

export const getBuildTimestampTransformer = (): string =>
  typeof __BUILD_TIMESTAMP__ === 'undefined' ? 'dev' : __BUILD_TIMESTAMP__;
