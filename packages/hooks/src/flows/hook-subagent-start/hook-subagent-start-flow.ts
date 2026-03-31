/**
 * PURPOSE: Parses raw JSON input, delegates to the subagent-start hook responder, and produces process output
 *
 * USAGE:
 * const result = HookSubagentStartFlow({ inputData: '{"session_id":"...","agent_id":"...","agent_type":"Explore"}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookSubagentStartResponder } from '../../responders/hook/subagent-start/hook-subagent-start-responder';

export const HookSubagentStartFlow = ({ inputData }: { inputData: string }): ExecResult => {
  try {
    JSON.parse(inputData);

    const result = HookSubagentStartResponder();

    return execResultContract.parse({
      stderr: '',
      stdout: result.shouldOutput && result.content ? result.content : '',
      exitCode: 0,
    });
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
