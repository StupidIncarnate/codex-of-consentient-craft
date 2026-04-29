import type { StubArgument } from '@dungeonmaster/shared/@types';

import { thinkingBlockParamContract } from './thinking-block-param-contract';
import type { ThinkingBlockParam } from './thinking-block-param-contract';

/**
 * Extended thinking block — emitted by Claude when extended thinking is enabled,
 * containing the model's internal reasoning process before producing a response.
 */
export const ThinkingBlockParamStub = ({
  ...props
}: StubArgument<ThinkingBlockParam> = {}): ThinkingBlockParam =>
  thinkingBlockParamContract.parse({
    type: 'thinking',
    thinking: 'Let me reason through this problem step by step...',
    ...props,
  });
