import type { StubArgument } from '@dungeonmaster/shared/@types';

import { riftcarverResultContract } from './riftcarver-result-contract';
import type { RiftcarverResult } from './riftcarver-result-contract';

export const RiftcarverResultStub = ({
  ...props
}: StubArgument<RiftcarverResult> = {}): RiftcarverResult =>
  riftcarverResultContract.parse({
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    createdAt: '2024-01-15T10:00:00.000Z',
    exitCode: 0,
    outcome: 'green',
    ...props,
  });
