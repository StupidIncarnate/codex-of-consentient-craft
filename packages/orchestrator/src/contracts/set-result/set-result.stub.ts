/**
 * PURPOSE: Builds a valid SetResult for tests
 *
 * USAGE:
 * SetResultStub();
 * // Returns a valid SetResult
 */

import { setResultContract } from './set-result-contract';
import type { SetResult } from './set-result-contract';

export const SetResultStub = (): SetResult => setResultContract.parse({ success: true });
