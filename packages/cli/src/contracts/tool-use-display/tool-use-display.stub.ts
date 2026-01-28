import { toolUseDisplayContract } from './tool-use-display-contract';
import type { ToolUseDisplay } from './tool-use-display-contract';

export const ToolUseDisplayStub = (
  { value }: { value: string } = { value: '[mcp__dungeonmaster__discover]' },
): ToolUseDisplay => toolUseDisplayContract.parse(value);
