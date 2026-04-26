import type { StubArgument } from '@dungeonmaster/shared/@types';

import { normalizedStreamLineContract } from './normalized-stream-line-contract';
import type { NormalizedStreamLine } from './normalized-stream-line-contract';

/**
 * Default normalized stream line — assistant text shape post `claudeLineNormalizeBroker`.
 * Used as a baseline from which tests override individual fields via `props`.
 */
export const NormalizedStreamLineStub = ({
  ...props
}: StubArgument<NormalizedStreamLine> = {}): NormalizedStreamLine =>
  normalizedStreamLineContract.parse({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello world' }],
    },
    ...props,
  });
