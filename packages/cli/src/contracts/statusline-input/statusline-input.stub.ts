import type { StubArgument } from '@dungeonmaster/shared/@types';

import { statuslineInputContract } from './statusline-input-contract';
import type { StatuslineInput } from './statusline-input-contract';

export const StatuslineInputStub = ({
  ...props
}: StubArgument<StatuslineInput> = {}): StatuslineInput =>
  statuslineInputContract.parse({
    rate_limits: {
      five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
      seven_day: { used_percentage: 20, resets_at: '2026-05-05T15:00:00.000Z' },
    },
    ...props,
  });
