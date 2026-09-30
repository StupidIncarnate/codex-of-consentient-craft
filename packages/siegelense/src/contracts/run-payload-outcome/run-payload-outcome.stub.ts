/**
 * PURPOSE: Builds a valid RunPayloadOutcome for tests
 *
 * USAGE:
 * RunPayloadOutcomeStub();
 * // Returns a valid RunPayloadOutcome
 */
import { RunRequestStub } from '../run-request/run-request.stub';

import { runPayloadOutcomeContract } from './run-payload-outcome-contract';
import type { RunPayloadOutcome } from './run-payload-outcome-contract';

export const RunPayloadOutcomeStub = (): RunPayloadOutcome =>
  runPayloadOutcomeContract.parse({ success: true, data: RunRequestStub() });
