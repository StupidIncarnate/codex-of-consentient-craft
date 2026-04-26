import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardDetailResponseContract } from './ward-detail-response-contract';
import type { WardDetailResponse } from './ward-detail-response-contract';

export const WardDetailResponseStub = ({
  ...props
}: StubArgument<WardDetailResponse> = {}): WardDetailResponse =>
  wardDetailResponseContract.parse({
    type: 'ward-detail-response',
    wardResultId: 'a47ac10b-58cc-4372-a567-0e02b2c3d999',
    detail: {},
    ...props,
  });
