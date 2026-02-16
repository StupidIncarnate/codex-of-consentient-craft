#!/usr/bin/env node
/**
 * PURPOSE: Entry point for pre-bash hook that blocks direct jest/eslint/tsc invocations
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | node start-pre-bash-hook.ts
 * // Reads JSON from stdin, validates, checks if command is blocked, exits with code 2 if blocked
 */

import { HookPreBashResponder } from '../responders/hook/pre-bash/hook-pre-bash-responder';
import { isValidHookDataContract } from '../contracts/is-valid-hook-data/is-valid-hook-data-contract';
import type { HookData } from '../contracts/hook-data/hook-data-contract';

const ERROR_CODE_INVALID_INPUT = 1;
const ERROR_CODE_BLOCK_COMMAND = 2;

export const StartPreBashHook = ({ inputData }: { inputData: string }): void => {
  try {
    const parsedData: unknown = JSON.parse(inputData);

    if (!isValidHookDataContract({ data: parsedData })) {
      process.stderr.write('Invalid hook data format\n');
      process.exit(ERROR_CODE_INVALID_INPUT);
    }

    const result = HookPreBashResponder({ input: parsedData as HookData });

    if (result.shouldBlock) {
      const errorMessage = result.message ?? 'Command blocked';
      process.stderr.write(`${errorMessage}\n`);
      process.exit(ERROR_CODE_BLOCK_COMMAND);
    }

    process.exit(0);
  } catch (parseError: unknown) {
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    const stack = parseError instanceof Error ? parseError.stack : '';
    process.stderr.write(`Hook error: ${errorMessage}\n`);
    if (stack) {
      process.stderr.write(`${stack}\n`);
    }
    process.exit(ERROR_CODE_INVALID_INPUT);
  }
};

if (require.main === module) {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    try {
      StartPreBashHook({ inputData });
    } catch (unexpectedError: unknown) {
      const errorMessage =
        unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
      const stack = unexpectedError instanceof Error ? unexpectedError.stack : '';
      process.stderr.write(`Unexpected hook error: ${errorMessage}\n`);
      if (stack) {
        process.stderr.write(`${stack}\n`);
      }
      process.exit(ERROR_CODE_INVALID_INPUT);
    }
  });
}
