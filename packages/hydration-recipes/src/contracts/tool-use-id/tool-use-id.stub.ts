/**
 * PURPOSE: Builds a valid `ToolUseId` for a test that needs one but does not care which Task
 * dispatch it correlates to.
 *
 * USAGE:
 * ToolUseIdStub({ value: 'toolu_seed1' });
 * // Returns ToolUseId
 */
import { toolUseIdContract } from './tool-use-id-contract';
import type { ToolUseId } from './tool-use-id-contract';

export const ToolUseIdStub = ({ value }: { value: string } = { value: 'toolu_seed1' }): ToolUseId =>
  toolUseIdContract.parse(value);
