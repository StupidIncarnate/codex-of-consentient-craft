#!/usr/bin/env node

/**
 * PURPOSE: Entry point for session start hook that loads standards for new sessions
 *
 * USAGE:
 * echo '{"hook_event_name":"SessionStart",...}' | node start-session-start-hook.ts
 * // Reads JSON from stdin, validates, outputs standards content to stdout if new session
 */
import { HookSessionStartResponder } from '../responders/hook/session-start/hook-session-start-responder';
import { isSessionStartHookData } from '../contracts/is-session-start-hook-data/is-session-start-hook-data';
import { debugDebug } from '../adapters/debug/debug-debug';

const log = debugDebug({ namespace: 'questmaestro:session-start-hook' });
const ERROR_CODE_INVALID_INPUT = 1;

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

        if (!isSessionStartHookData(dataWrapper)) {
          log('Invalid hook data format');
          process.exit(ERROR_CODE_INVALID_INPUT);
        }

        const result = await HookSessionStartResponder({ input: dataWrapper.data });

        if (result.shouldOutput && result.content !== undefined && result.content !== '') {
          process.stdout.write(result.content);
        }

        process.exit(0);
      } catch (error) {
        log('Error in session start hook:', error);
        process.exit(ERROR_CODE_INVALID_INPUT);
      }
    };
    runAsync().catch(() => undefined);
  });
}
