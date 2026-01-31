/**
 * PURPOSE: Retrieves the build timestamp injected at bundle time by esbuild
 *
 * USAGE:
 * getBuildTimestampTransformer();
 * // Returns 'Jan 30 2:45 PM' or 'dev' if not bundled
 */

import { buildTimestampContract } from '../../contracts/build-timestamp/build-timestamp-contract';
import type { BuildTimestamp } from '../../contracts/build-timestamp/build-timestamp-contract';

declare const __BUILD_TIMESTAMP__: unknown;

export const getBuildTimestampTransformer = (): BuildTimestamp => {
  const timestamp = typeof __BUILD_TIMESTAMP__ === 'undefined' ? 'dev' : __BUILD_TIMESTAMP__;
  return buildTimestampContract.parse(timestamp);
};
