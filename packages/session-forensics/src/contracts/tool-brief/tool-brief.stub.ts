import { toolBriefContract, type ToolBrief } from './tool-brief-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ToolBriefStub = ({ ...props }: StubArgument<ToolBrief> = {}): ToolBrief =>
  toolBriefContract.parse({
    name: 'Read',
    brief: 'file_path=/tmp/x.ts',
    ...props,
  });
