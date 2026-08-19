import { toolResultDisplayContentContract } from './tool-result-display-content-contract';
import type { ToolResultDisplayContent } from './tool-result-display-content-contract';

export const ToolResultDisplayContentStub = (
  { value }: { value: string } = { value: 'file contents here' },
): ToolResultDisplayContent => toolResultDisplayContentContract.parse(value);
