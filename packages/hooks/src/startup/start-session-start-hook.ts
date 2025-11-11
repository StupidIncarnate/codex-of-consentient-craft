#!/usr/bin/env node
/**
 * PURPOSE: Entry point for session start hook that loads standards for new sessions
 *
 * USAGE:
 * echo '{"hook_event_name":"SessionStart",...}' | node start-session-start-hook.ts
 * // Reads JSON from stdin, validates, outputs standards content to stdout if new session
 */

import { HookSessionStartResponder } from '../responders/hook/session-start/hook-session-start-responder';
import { isSessionStartHookDataContract } from '../contracts/is-session-start-hook-data/is-session-start-hook-data-contract';
import { debugDebugAdapter } from '../adapters/debug/debug/debug-debug-adapter';
import type { SessionStartHookData } from '../contracts/session-start-hook-data/session-start-hook-data-contract';

const log = debugDebugAdapter({ namespace: 'questmaestro:session-start-hook' });
const ERROR_CODE_INVALID_INPUT = 1;

export const StartSessionStartHook = async ({
  inputData,
}: {
  inputData: string;
}): Promise<void> => {
  try {
    const parsedData: unknown = JSON.parse(inputData);

    if (!isSessionStartHookDataContract({ data: parsedData })) {
      log('Invalid hook data format');
      process.exit(ERROR_CODE_INVALID_INPUT);
    }

    const result = await HookSessionStartResponder({ input: parsedData as SessionStartHookData });

    if (result.shouldOutput && result.content !== undefined && result.content !== '') {
      process.stdout.write(result.content);
    }

    process.exit(0);
  } catch (error: unknown) {
    log('Error in session start hook:', error);
    process.exit(ERROR_CODE_INVALID_INPUT);
  }
};

if (require.main === module) {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    StartSessionStartHook({ inputData }).catch(() => undefined);
  });
}
