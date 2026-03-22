import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardResultContract } from './ward-result-contract';
import type { WardResult } from './ward-result-contract';

export const WardResultStub = ({ ...props }: StubArgument<WardResult> = {}): WardResult =>
  wardResultContract.parse({
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    createdAt: '2024-01-15T10:00:00.000Z',
    exitCode: 1,
    ...props,
  });
