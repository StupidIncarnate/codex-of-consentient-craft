/**
 * PURPOSE: Parses raw JSON input, delegates to the pre-bash hook responder, and produces process output
 *
 * USAGE:
 * const result = HookPreBashFlow({ inputData: '{"hook_event_name":"PreToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookPreBashResponder } from '../../responders/hook/pre-bash/hook-pre-bash-responder';

const EXIT_CODE_BLOCK = 2;

export const HookPreBashFlow = ({ inputData }: { inputData: string }): ExecResult => {
  try {
    const parsed: unknown = JSON.parse(inputData);

    const result = HookPreBashResponder({
      input: parsed as Parameters<typeof HookPreBashResponder>[0]['input'],
    });

    if (result.updatedCommand || result.updatedTimeout) {
      const updatedInput: {
        command?: typeof result.updatedCommand;
        timeout?: typeof result.updatedTimeout;
      } = {};

      if (result.updatedCommand) {
        updatedInput.command = result.updatedCommand;
      }

      if (result.updatedTimeout) {
        updatedInput.timeout = result.updatedTimeout;
      }

      return execResultContract.parse({
        stderr: '',
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput,
          },
        }),
        exitCode: 0,
      });
    }

    return execResultContract.parse({
      stderr: result.shouldBlock ? `${result.message ?? 'Command blocked'}\n` : '',
      stdout: '',
      exitCode: Number(result.shouldBlock) * EXIT_CODE_BLOCK,
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
