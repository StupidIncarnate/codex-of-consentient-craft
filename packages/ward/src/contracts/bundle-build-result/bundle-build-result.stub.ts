/**
 * PURPOSE: Builds a valid BundleBuildResult for tests
 *
 * USAGE:
 * BundleBuildResultStub();
 * // Returns a valid BundleBuildResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { bundleBuildResultContract } from './bundle-build-result-contract';
import type { BundleBuildResult } from './bundle-build-result-contract';

export const BundleBuildResultStub = ({
  ...props
}: StubArgument<BundleBuildResult> = {}): BundleBuildResult =>
  bundleBuildResultContract.parse({ bundleDir: 'sample', error: 'sample', ...props });
