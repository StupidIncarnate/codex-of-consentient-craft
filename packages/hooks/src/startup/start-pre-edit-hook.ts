#!/usr/bin/env node

import { HookPreEditResponder } from '../responders/hook/pre-edit/hook-pre-edit-responder';
import { isValidHookData } from '../contracts/is-valid-hook-data/is-valid-hook-data';

const ERROR_CODE_INVALID_INPUT = 1;
const ERROR_CODE_BLOCK_EDIT = 2;

if (require.main === module) {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    const runAsync = async (): Promise<void> => {
      try {
        const parsedData: unknown = JSON.parse(inputData);
        const dataWrapper = { data: parsedData };

        if (!isValidHookData(dataWrapper)) {
          process.stderr.write('Invalid hook data format\n');
          process.exit(ERROR_CODE_INVALID_INPUT);
        }

        const result = await HookPreEditResponder({ input: dataWrapper.data });

        if (result.shouldBlock) {
          const errorMessage = result.message ?? 'New violations detected';
          process.stderr.write(`${errorMessage}\n`);
          process.exit(ERROR_CODE_BLOCK_EDIT);
        }

        process.exit(0);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        const stack = parseError instanceof Error ? parseError.stack : '';
        process.stderr.write(`Hook error: ${errorMessage}\n`);
        if (stack) {
          process.stderr.write(`${stack}\n`);
        }
        process.exit(ERROR_CODE_INVALID_INPUT);
      }
    };
    runAsync().catch((unexpectedError: unknown) => {
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
