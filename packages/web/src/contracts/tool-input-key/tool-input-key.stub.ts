import { toolInputKeyContract } from './tool-input-key-contract';
import type { ToolInputKey } from './tool-input-key-contract';

export const ToolInputKeyStub = (
  { value }: { value: string } = { value: 'command' },
): ToolInputKey => toolInputKeyContract.parse(value);
