/**
 * PURPOSE: Builds a valid SmoketestRunTeardownChecksResult for tests
 *
 * USAGE:
 * SmoketestRunTeardownChecksResultStub();
 * // Returns a valid SmoketestRunTeardownChecksResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestRunTeardownChecksResultContract } from './smoketest-run-teardown-checks-result-contract';
import type { SmoketestRunTeardownChecksResult } from './smoketest-run-teardown-checks-result-contract';

export const SmoketestRunTeardownChecksResultStub = ({
  ...props
}: StubArgument<SmoketestRunTeardownChecksResult> = {}): SmoketestRunTeardownChecksResult =>
  smoketestRunTeardownChecksResultContract.parse({ passed: false, failures: [], ...props });
