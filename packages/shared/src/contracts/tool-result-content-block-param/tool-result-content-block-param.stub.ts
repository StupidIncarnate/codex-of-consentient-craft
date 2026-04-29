import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolResultContentBlockParamContract } from './tool-result-content-block-param-contract';
import type { ToolResultContentBlockParam } from './tool-result-content-block-param-contract';

/**
 * Default tool result content block — a text block, the most common element
 * inside a tool_result content array.
 */
export const ToolResultContentBlockParamStub = ({
  ...props
}: StubArgument<ToolResultContentBlockParam> = {}): ToolResultContentBlockParam =>
  toolResultContentBlockParamContract.parse({
    type: 'text',
    text: 'Tool result content.',
    ...props,
  });
