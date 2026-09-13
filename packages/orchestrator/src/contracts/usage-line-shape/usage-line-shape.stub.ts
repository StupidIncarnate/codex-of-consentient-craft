import type { StubArgument } from '@dungeonmaster/shared/@types';

import { usageLineShapeContract } from './usage-line-shape-contract';
import type { UsageLineShape } from './usage-line-shape-contract';

export const UsageLineShapeStub = ({
  ...props
}: StubArgument<UsageLineShape> = {}): UsageLineShape =>
  usageLineShapeContract.parse({
    timestamp: '2026-09-13T04:49:29.242Z',
    message: {
      usage: {
        input_tokens: 120,
        cache_creation_input_tokens: 4_000,
        cache_read_input_tokens: 90_000,
        output_tokens: 300,
      },
    },
    ...props,
  });
