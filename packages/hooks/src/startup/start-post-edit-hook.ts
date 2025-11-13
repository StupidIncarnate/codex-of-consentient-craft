#!/usr/bin/env node
/**
 * PURPOSE: Entry point for post-edit hook that runs ESLint auto-fix and reports remaining errors
 *
 * USAGE:
 * echo '{"hook_event_name":"PostToolUse",...}' | node start-post-edit-hook.ts
 * // Reads JSON from stdin, runs auto-fix, reports remaining error-level violations, exits with code 0
 */

import { HookPostEditResponder } from '../responders/hook/post-edit/hook-post-edit-responder';
import { isValidHookDataContract } from '../contracts/is-valid-hook-data/is-valid-hook-data-contract';
import type { HookData } from '../contracts/hook-data/hook-data-contract';

const ERROR_CODE_INVALID_INPUT = 1;

export const StartPostEditHook = async ({ inputData }: { inputData: string }): Promise<void> => {
  try {
    const parsedData: unknown = JSON.parse(inputData);

    if (!isValidHookDataContract({ data: parsedData })) {
      process.stderr.write('Invalid hook data format\n');
      process.exit(ERROR_CODE_INVALID_INPUT);
    }

    const result = await HookPostEditResponder({ input: parsedData as HookData });

    // Post-edit hook outputs violations to stdout ONLY if there are unfixable errors
    // This is informational only - never blocks (always exit 0)
    if (
      result.violations.length > 0 &&
      result.message !== 'All violations auto-fixed successfully'
    ) {
      const output = {
        decision: 'block',
        reason: result.message,
      };
      process.stdout.write(JSON.stringify(output));
    }

    // Always exit with success (post-edit hook never blocks execution, just provides feedback)
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
    StartPostEditHook({ inputData }).catch((unexpectedError: unknown) => {
      const errorMessage =
        unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
      const stack = unexpectedError instanceof Error ? unexpectedError.stack : '';
      process.stderr.write(`Unexpected hook error: ${errorMessage}\n`);
      if (stack) {
        process.stderr.write(`${stack}\n`);
      }
      process.exit(ERROR_CODE_INVALID_INPUT);
    });
  });
}
