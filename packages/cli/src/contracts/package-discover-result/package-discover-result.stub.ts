/**
 * PURPOSE: Builds a valid PackageDiscoverResult for tests
 *
 * USAGE:
 * PackageDiscoverResultStub();
 * // Returns a valid PackageDiscoverResult
 */

import { packageDiscoverResultContract } from './package-discover-result-contract';
import type { PackageDiscoverResult } from './package-discover-result-contract';

export const PackageDiscoverResultStub = (): PackageDiscoverResult =>
  packageDiscoverResultContract.parse([]);
