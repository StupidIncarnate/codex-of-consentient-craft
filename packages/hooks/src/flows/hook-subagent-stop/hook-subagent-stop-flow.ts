/**
 * PURPOSE: Parses raw SubagentStop hook stdin, delegates to the subagent-stop responder, and produces process output (ExecResult) for the startup bin to write
 *
 * USAGE:
 * const result = await HookSubagentStopFlow({ inputData: '{"hook_event_name":"SubagentStop",...}' });
 * // Returns ExecResult with stdout (block decision JSON or empty), stderr, exitCode
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { HookSubagentStopResponder } from '../../responders/hook/subagent-stop/hook-subagent-stop-responder';
import { subagentStopHookDataContract } from '../../contracts/subagent-stop-hook-data/subagent-stop-hook-data-contract';

export const HookSubagentStopFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const hookData = subagentStopHookDataContract.safeParse(JSON.parse(inputData));

    if (!hookData.success) {
      return execResultContract.parse({ stderr: '', stdout: '', exitCode: 0 });
    }

    return await HookSubagentStopResponder({ hookInput: hookData.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return execResultContract.parse({
      stderr: `Hook error: ${message}\n${stack ? `${stack}\n` : ''}`,
      stdout: '',
      exitCode: 1,
    });
  }
};
