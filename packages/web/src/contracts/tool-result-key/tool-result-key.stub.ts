import { toolResultKeyContract } from './tool-result-key-contract';
import type { ToolResultKey } from './tool-result-key-contract';

export const ToolResultKeyStub = (
  { value }: { value: string } = { value: 'prompt' },
): ToolResultKey => toolResultKeyContract.parse(value);
