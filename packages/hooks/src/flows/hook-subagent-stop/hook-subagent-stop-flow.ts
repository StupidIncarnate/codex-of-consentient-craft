/**
 * PURPOSE: Parses raw SubagentStop hook stdin, delegates to the subagent-stop responder, and produces process output (ExecResult) for the startup bin to write
 *
 * USAGE:
 * const result = await HookSubagentStopFlow({ inputData: '{"hook_event_name":"SubagentStop",...}' });
 * // Returns ExecResult with stdout (block decision JSON or empty), stderr, exitCode
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookSubagentStopResponder } from '../../responders/hook/subagent-stop/hook-subagent-stop-responder';

export const HookSubagentStopFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const hookInput: unknown = JSON.parse(inputData);

    return await HookSubagentStopResponder({ hookInput });
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
