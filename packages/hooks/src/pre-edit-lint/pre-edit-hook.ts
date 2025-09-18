#!/usr/bin/env node

import { PreEditLint } from './pre-edit-lint';
import type { HookData } from '../types/hook-type';

function main(): void {
  let inputData = '';

  process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
  });

  process.stdin.on('end', () => {
    void (async () => {
      try {
        const hookData = JSON.parse(inputData) as HookData;

        // Only handle PreToolUse events
        if (hookData.hook_event_name !== 'PreToolUse' || !('tool_name' in hookData)) {
          console.error(`Unsupported hook event: ${hookData.hook_event_name}`);
          process.exit(1);
        }

        // Check for newly introduced violations
        const result = await PreEditLint.checkForNewViolations({
          toolInput: hookData.tool_input,
          cwd: hookData.cwd,
        });

        if (result.hasNewViolations) {
          console.error(result.message || 'New violations detected');
          process.exit(2); // Exit code 2 blocks the edit
        }

        // No violations found - allow the edit
        process.exit(0);
      } catch (parseError) {
        console.error(
          `Hook parsing error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
        process.exit(1);
      }
    })();
  });
}

if (require.main === module) {
  void main();
}

export { main as preEditHook };
