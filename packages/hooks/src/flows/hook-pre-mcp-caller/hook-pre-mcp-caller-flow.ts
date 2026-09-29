/**
 * PURPOSE: Parses raw JSON input, delegates to the pre-MCP-caller hook responder, and produces process output
 *
 * USAGE:
 * const result = HookPreMcpCallerFlow({ inputData: '{"hook_event_name":"PreToolUse",...}' });
 * // Returns ExecResult whose stdout carries the updatedInput, or is empty when there is nothing to add
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { HookPreMcpCallerResponder } from '../../responders/hook/pre-mcp-caller/hook-pre-mcp-caller-responder';
import { mcpPreToolUseHookDataContract } from '../../contracts/mcp-pre-tool-use-hook-data/mcp-pre-tool-use-hook-data-contract';

export const HookPreMcpCallerFlow = ({ inputData }: { inputData: string }): ExecResult => {
  try {
    const hookData = mcpPreToolUseHookDataContract.safeParse(JSON.parse(inputData));

    if (!hookData.success) {
      return execResultContract.parse({ stderr: '', stdout: '', exitCode: 0 });
    }

    const updatedInput = HookPreMcpCallerResponder({ input: hookData.data });

    // No permissionDecision: this hook adds context and nothing else, so the call's ordinary
    // permission rules still decide whether it runs.
    return execResultContract.parse({
      stderr: '',
      stdout:
        updatedInput === null
          ? ''
          : JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput } }),
      exitCode: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    return execResultContract.parse({
      stderr: `Hook error: ${message}\n`,
      stdout: '',
      exitCode: 1,
    });
  }
};
