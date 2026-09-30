/**
 * PURPOSE: Worker process that reads NDJSON envelopes from stdin, dispatches to a hook flow, writes NDJSON results
 *
 * USAGE:
 * echo '{"hookData":{...}}' | npx tsx hook-persistent-worker.ts /path/to/flow
 * // Reads {hookData?, rawInput?, args?} envelopes per line, processes through the flow, outputs results as NDJSON
 */
import { argv, exit, getStdin, stderr, stdout } from '#gateway/node/process';
import { dynamicImport } from '#gateway/node/module';
import { lineReader } from '#gateway/node/readline';

import type { ExecResult } from '@dungeonmaster/shared/contracts';

type AsyncHookFlow = (params: { inputData: string }) => Promise<ExecResult>;
type SyncHookFlow = (params: { inputData: string }) => ExecResult;
type SessionSnippetFlow = (params: {
  snippetKey: string | undefined;
  hookInput: unknown;
}) => Promise<ExecResult>;

interface FlowModule {
  HookPreEditFlow?: AsyncHookFlow;
  HookPostEditFlow?: AsyncHookFlow;
  HookSubagentStopFlow?: AsyncHookFlow;
  HookPreFolderDetailFlow?: AsyncHookFlow;
  HookPreBashFlow?: SyncHookFlow;
  HookPreSearchFlow?: SyncHookFlow;
  HookPreMcpCallerFlow?: SyncHookFlow;
  HookSessionSnippetFlow?: SessionSnippetFlow;
  HookAgyPreToolFlow?: AsyncHookFlow;
  HookAgyStopFlow?: AsyncHookFlow;
}

const writeResult = (result: ExecResult): void => {
  stdout.write(
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
    const result = await flowModule.HookSessionSnippetFlow({ snippetKey, hookInput });
    writeResult(result);
    return;
  }

  const asyncFlow =
    flowModule.HookPreEditFlow ??
    flowModule.HookPostEditFlow ??
    flowModule.HookSubagentStopFlow ??
    flowModule.HookPreFolderDetailFlow ??
    flowModule.HookAgyPreToolFlow ??
    flowModule.HookAgyStopFlow;
  if (asyncFlow) {
    const result = await asyncFlow({ inputData });
    writeResult(result);
    return;
  }

  const syncFlow =
    flowModule.HookPreBashFlow ?? flowModule.HookPreSearchFlow ?? flowModule.HookPreMcpCallerFlow;
  if (syncFlow) {
    const result = syncFlow({ inputData });
    writeResult(result);
    return;
  }

  stderr.write('No flow function found in module\n');
  exit(1);
};

const main = async (): Promise<void> => {
  const [, , flowPath] = argv;
  if (flowPath === undefined) {
    stderr.write('No flow path argument given\n');
    exit(1);
    return;
  }
  const flowModule = (await dynamicImport({ path: flowPath })) as FlowModule;

  stdout.write('READY\n');

  const reader = lineReader({ input: getStdin() });
  // Envelopes are answered strictly in arrival order: each line chains onto the previous one's
  // completion, because a caller pairs every response with the request it sent by position.
  const queue: { tail: Promise<void> } = { tail: Promise.resolve() };

  reader.onLine((line) => {
    queue.tail = queue.tail.then(async () => {
      try {
        const envelope = JSON.parse(line) as Parameters<typeof processEnvelope>[0]['envelope'];
        await processEnvelope({ envelope, flowModule });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        stdout.write(
          `${JSON.stringify({
            exitCode: 1,
            stdout: '',
            stderr: message,
          })}\n`,
        );
      }
    });
  });
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  stderr.write(`Worker fatal: ${message}\n`);
  exit(1);
});
