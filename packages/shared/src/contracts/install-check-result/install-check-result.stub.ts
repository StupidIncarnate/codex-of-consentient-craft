/**
 * PURPOSE: Builds a valid InstallCheckResult for tests
 *
 * USAGE:
 * InstallCheckResultStub();
 * // Returns a valid InstallCheckResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { installCheckResultContract } from './install-check-result-contract';
import type { InstallCheckResult } from './install-check-result-contract';

export const InstallCheckResultStub = ({
  ...props
}: StubArgument<InstallCheckResult> = {}): InstallCheckResult =>
  installCheckResultContract.parse({ valid: false, ...props });
