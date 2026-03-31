/**
 * PURPOSE: Parses raw JSON input, delegates to the pre-search hook responder, and produces process output
 *
 * USAGE:
 * const result = HookPreSearchFlow({ inputData: '{"hook_event_name":"PreToolUse",...}' });
 * // Returns ExecResult with stdout, stderr, exitCode (2 if blocked)
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookPreSearchResponder } from '../../responders/hook/pre-search/hook-pre-search-responder';

const EXIT_CODE_BLOCK = 2;

export const HookPreSearchFlow = ({ inputData }: { inputData: string }): ExecResult => {
  try {
    const parsed: unknown = JSON.parse(inputData);

    const result = HookPreSearchResponder({
      input: parsed,
    });

    return execResultContract.parse({
      stderr: result.shouldBlock ? `${result.message ?? 'Search blocked'}\n` : '',
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
