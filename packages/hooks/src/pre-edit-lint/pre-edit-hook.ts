#!/usr/bin/env node

import { PreEditLint } from './pre-edit-lint';
import type { HookData } from '../types/hook-type';

const hasStringProperty =
  (key: string) =>
  (obj: Record<string, unknown>): obj is Record<string, unknown> & Record<typeof key, string> =>
    typeof obj[key] === 'string';

const isValidHookData = (data: unknown): data is HookData => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // Use type predicate to avoid unsafe assertion
  if (!('hook_event_name' in data)) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  const hasHookEventName = hasStringProperty('hook_event_name');
  const hasSessionId = hasStringProperty('session_id');
  const hasTranscriptPath = hasStringProperty('transcript_path');
  const hasCwd = hasStringProperty('cwd');
  return hasHookEventName(obj) && hasSessionId(obj) && hasTranscriptPath(obj) && hasCwd(obj);
};

const main = (): void => {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    const runAsync = async (): Promise<void> => {
      try {
        const parsedData: unknown = JSON.parse(inputData);
        if (!isValidHookData(parsedData)) {
          process.stderr.write('Invalid hook data format\n');
          process.exit(1);
        }
        const hookData = parsedData;

        // Only handle PreToolUse events
        if (hookData.hook_event_name !== 'PreToolUse' || !('tool_name' in hookData)) {
          process.stderr.write(`Unsupported hook event: ${hookData.hook_event_name}\n`);
          process.exit(1);
        }

        // Check for newly introduced violations
        const result = await PreEditLint.checkForNewViolations({
          toolInput: hookData.tool_input,
          cwd: hookData.cwd,
        });

        if (result.hasNewViolations) {
          const ERROR_CODE_BLOCK = 2;
          const errorMessage = result.message ?? 'New violations detected';
          process.stderr.write(`${errorMessage}\n`);
          process.exit(ERROR_CODE_BLOCK); // Exit code 2 blocks the edit
        }

        // No violations found - allow the edit
        process.exit(0);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        process.stderr.write(`Hook parsing error: ${errorMessage}\n`);
        process.exit(1);
      }
    };
    runAsync().catch(() => undefined);
  });
};

if (require.main === module) {
  main();
}

export { main as preEditHook };
