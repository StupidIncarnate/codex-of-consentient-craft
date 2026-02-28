/**
 * PURPOSE: Parses raw JSON input, delegates to the session-start hook responder, and produces process output
 *
 * USAGE:
 * const result = await HookSessionStartFlow({ inputData: '{"session_id":"...","transcript_path":"..."}' });
 * // Returns ExecResult with stdout, stderr, exitCode
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { HookSessionStartResponder } from '../../responders/hook/session-start/hook-session-start-responder';

export const HookSessionStartFlow = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  try {
    const parsed: unknown = JSON.parse(inputData);

    const result = await HookSessionStartResponder({
      input: parsed as Parameters<typeof HookSessionStartResponder>[0]['input'],
    });

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
