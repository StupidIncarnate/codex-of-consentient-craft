/**
 * PURPOSE: Worker process that reads NDJSON from stdin, calls HookPreEditFlow, writes NDJSON results
 *
 * USAGE:
 * echo '{"hook_event_name":"PreToolUse",...}' | npx tsx hook-persistent-worker.ts /path/to/flow
 * // Reads line-delimited JSON, processes each through the flow, outputs results as NDJSON
 */
import * as readline from 'readline';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import type { ExecResult } from '../../../src/contracts/exec-result/exec-result-contract';

type HookFlow = (params: { inputData: string }) => Promise<ExecResult>;

interface FlowModule {
  HookPreEditFlow?: HookFlow;
  HookPostEditFlow?: HookFlow;
}

const main = async (): Promise<void> => {
  const flowModule = (await import(filePathContract.parse(process.argv[2]))) as FlowModule;
  const flow: HookFlow | undefined = flowModule.HookPreEditFlow ?? flowModule.HookPostEditFlow;

  if (!flow) {
    process.stderr.write('No flow function found in module\n');
    process.exit(1);
  }

  // Signal ready
  process.stdout.write('READY\n');

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  for await (const line of rl) {
    try {
      const result: ExecResult = await flow({ inputData: line });
      process.stdout.write(
        `${JSON.stringify({
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        })}\n`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        `${JSON.stringify({
          exitCode: 1,
          stdout: '',
          stderr: message,
        })}\n`,
      );
    }
  }
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Worker fatal: ${message}\n`);
  process.exit(1);
});
