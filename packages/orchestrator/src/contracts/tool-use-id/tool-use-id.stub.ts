import { toolUseIdContract } from './tool-use-id-contract';
import type { ToolUseId } from './tool-use-id-contract';

export const ToolUseIdStub = (
  { value }: { value: string } = { value: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ' },
): ToolUseId => toolUseIdContract.parse(value);
