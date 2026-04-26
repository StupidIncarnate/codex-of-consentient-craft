import type { StubArgument } from '@dungeonmaster/shared/@types';

import { normalizedStreamLineContentItemContract } from './normalized-stream-line-content-item-contract';
import type { NormalizedStreamLineContentItem } from './normalized-stream-line-content-item-contract';

/**
 * Default content item — text variant. Tests override `type`, `name`, etc. via props
 * to construct tool_use, tool_result, thinking, etc. variants.
 */
export const NormalizedStreamLineContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'text',
    text: 'Hello world',
    ...props,
  });
