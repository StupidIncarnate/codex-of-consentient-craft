import type { StubArgument } from '@dungeonmaster/shared/@types';

import { toolResultPartContract } from './tool-result-part-contract';
import type { ToolResultPart } from './tool-result-part-contract';

export const ToolResultPartStub = ({
  ...props
}: StubArgument<ToolResultPart> = {}): ToolResultPart =>
  toolResultPartContract.parse({
    kind: 'text',
    text: 'file contents here',
    ...props,
  });

export const ToolResultMarkdownPartStub = ({
  ...props
}: StubArgument<ToolResultPart> = {}): ToolResultPart =>
  toolResultPartContract.parse({
    kind: 'markdown',
    label: 'prompt',
    source: '# Operator\n\nYou own ONE operation item.',
    ...props,
  });
