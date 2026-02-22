import { toolNameContract } from './tool-name-contract';
import type { ToolName } from './tool-name-contract';

export const ToolNameStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'discover',
  },
): ToolName => toolNameContract.parse(value);
