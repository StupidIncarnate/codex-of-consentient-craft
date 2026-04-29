import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolReferenceBlockParamContract } from './tool-reference-block-param-contract';
import type { ToolReferenceBlockParam } from './tool-reference-block-param-contract';

/**
 * Tool reference block — emitted when Claude includes a reference to a tool by name
 * inside a content array (e.g., inside a tool_result block referencing the originating tool).
 */
export const ToolReferenceBlockParamStub = ({
  ...props
}: StubArgument<ToolReferenceBlockParam> = {}): ToolReferenceBlockParam =>
  toolReferenceBlockParamContract.parse({
    type: 'tool_reference',
    tool_name: 'mcp__dungeonmaster__get-quest',
    ...props,
  });
