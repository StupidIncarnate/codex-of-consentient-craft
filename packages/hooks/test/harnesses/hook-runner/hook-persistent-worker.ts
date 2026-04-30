/**
 * PURPOSE: Worker process that reads NDJSON envelopes from stdin, dispatches to a hook flow, writes NDJSON results
 *
 * USAGE:
 * echo '{"hookData":{...}}' | npx tsx hook-persistent-worker.ts /path/to/flow
 * // Reads {hookData?, rawInput?, args?} envelopes per line, processes through the flow, outputs results as NDJSON
 */
import * as readline from 'readline';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import type { ExecResult } from '../../../src/contracts/exec-result/exec-result-contract';

type AsyncHookFlow = (params: { inputData: string }) => Promise<ExecResult>;
type SyncHookFlow = (params: { inputData: string }) => ExecResult;
type SessionSnippetFlow = (params: {
  snippetKey: string | undefined;
  hookInput: unknown;
}) => ExecResult;

interface FlowModule {
  HookPreEditFlow?: AsyncHookFlow;
  HookPostEditFlow?: AsyncHookFlow;
  HookPreBashFlow?: SyncHookFlow;
  HookSessionSnippetFlow?: SessionSnippetFlow;
}

const writeResult = (result: ExecResult): void => {
  process.stdout.write(
    `${JSON.stringify({
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    })}\n`,
  );
};

const processEnvelope = async (params: {
  envelope: { hookData?: unknown; rawInput?: string; args?: readonly string[] };
  flowModule: FlowModule;
}): Promise<void> => {
  const { envelope, flowModule } = params;
  const inputData = envelope.rawInput ?? JSON.stringify(envelope.hookData);

  if (flowModule.HookSessionSnippetFlow) {
    const snippetKey = envelope.args?.[0];
    const hookInput: unknown =
      envelope.rawInput === undefined ? envelope.hookData : JSON.parse(envelope.rawInput);
    const result = flowModule.HookSessionSnippetFlow({ snippetKey, hookInput });
    writeResult(result);
    return;
  }

  const asyncFlow = flowModule.HookPreEditFlow ?? flowModule.HookPostEditFlow;
  if (asyncFlow) {
    const result = await asyncFlow({ inputData });
    writeResult(result);
    return;
  }

  if (flowModule.HookPreBashFlow) {
    const result = flowModule.HookPreBashFlow({ inputData });
    writeResult(result);
    return;
  }

  process.stderr.write('No flow function found in module\n');
  process.exit(1);
};

const main = async (): Promise<void> => {
  const flowModule = (await import(filePathContract.parse(process.argv[2]))) as FlowModule;

  process.stdout.write('READY\n');

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  for await (const line of rl) {
    try {
      const envelope = JSON.parse(line) as Parameters<typeof processEnvelope>[0]['envelope'];
      await processEnvelope({ envelope, flowModule });
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
