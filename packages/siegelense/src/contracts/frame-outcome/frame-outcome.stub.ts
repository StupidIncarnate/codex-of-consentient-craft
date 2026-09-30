/**
 * PURPOSE: Builds a valid FrameOutcome for tests
 *
 * USAGE:
 * FrameOutcomeStub();
 * // Returns a valid FrameOutcome
 */
import { DriverRequestStub } from '../driver-request/driver-request.stub';

import { frameOutcomeContract } from './frame-outcome-contract';
import type { FrameOutcome } from './frame-outcome-contract';

export const FrameOutcomeStub = (): FrameOutcome =>
  frameOutcomeContract.parse({ success: true, data: DriverRequestStub() });
