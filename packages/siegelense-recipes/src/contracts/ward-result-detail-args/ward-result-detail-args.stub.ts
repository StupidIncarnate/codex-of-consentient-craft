/**
 * PURPOSE: Builds a valid `WardResultDetailArgs` for a test that needs one but does not care which
 * ward result or detail blob it names.
 *
 * USAGE:
 * WardResultDetailArgsStub({ wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns WardResultDetailArgs
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardResultDetailArgsContract } from './ward-result-detail-args-contract';
import type { WardResultDetailArgs } from './ward-result-detail-args-contract';

export const WardResultDetailArgsStub = ({
  ...props
}: StubArgument<WardResultDetailArgs> = {}): WardResultDetailArgs =>
  wardResultDetailArgsContract.parse({
    wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    detail: { testFailures: [] },
    ...props,
  });
