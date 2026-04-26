/**
 * PURPOSE: Provides a persistent child process for running hook flows without respawning per test
 *
 * USAGE:
 * const runner = hookPersistentRunnerHarness();
 * beforeAll(async () => { await runner.start({ hookName: 'start-pre-edit-hook' }); });
 * afterAll(async () => { await runner.stop(); });
 * const result = await runner.runHook({ hookData: someData });
 * // result.exitCode, result.stdout, result.stderr
 */
import * as path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import * as readline from 'readline';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { ExecResultStub } from '../../../src/contracts/exec-result/exec-result.stub';

type HookName = 'start-pre-bash-hook' | 'start-post-edit-hook' | 'start-pre-edit-hook';

const WORKER_PATH = path.join(__dirname, 'hook-persistent-worker.ts');

export const hookPersistentRunnerHarness = (): {
  start: (params: { hookName: HookName }) => Promise<void>;
  stop: () => Promise<void>;
  runHook: (params: { hookData: unknown }) => Promise<ReturnType<typeof ExecResultStub>>;
} => {
  let child: ChildProcess | null = null;
  let rl: readline.Interface | null = null;
  let responseQueue: {
    resolve: (value: ReturnType<typeof ExecResultStub>) => void;
    reject: (error: Error) => void;
  }[] = [];

  const resolveFlowPath = ({ hookName }: { hookName: HookName }): FilePath => {
    const flowName = hookName.replace('start-', 'hook-').replace(/-hook$/u, '');
    return FilePathStub({
      value: path.join(process.cwd(), 'src', 'flows', flowName, `${flowName}-flow`),
    });
  };

  const handleResponse = (line: string): void => {
    const pending = responseQueue.shift();
    if (pending) {
      try {
        pending.resolve(ExecResultStub(JSON.parse(line)));
      } catch {
        pending.reject(new Error(`Failed to parse worker response: ${line}`));
      }
    }
  };

  const start = async ({ hookName }: { hookName: HookName }): Promise<void> => {
    const flowPath = resolveFlowPath({ hookName });

    child = spawn('npx', ['tsx', WORKER_PATH, String(flowPath)], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    rl = readline.createInterface({
      input: child.stdout!,
      terminal: false,
    });

    // Wait for READY signal
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker startup timeout (30s)'));
      }, 30000);

      const onLine = (line: string): void => {
        if (line === 'READY') {
          clearTimeout(timeout);
          // Switch to normal response handling
          rl!.removeListener('line', onLine);
          rl!.on('line', handleResponse);
          resolve();
        }
      };

      child!.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });

      let stderrOutput = '';
      child!.stderr!.on('data', (chunk: Buffer) => {
        stderrOutput += chunk.toString();
      });

      child!.on('close', (code: number | null) => {
        if (code !== null && code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Worker exited with code ${String(code)}: ${stderrOutput}`));
        }
      });

      rl!.on('line', onLine);
    });
  };

  const stop = async (): Promise<void> => {
    const currentChild = child;
    const currentRl = rl;

    child = null;
    rl = null;
    responseQueue = [];

    if (currentChild) {
      currentChild.stdin!.end();
      await new Promise<void>((resolve) => {
        currentChild.on('close', () => {
          resolve();
        });
        setTimeout(() => {
          currentChild.kill();
          resolve();
        }, 5000);
      });
    }
    if (currentRl) {
      currentRl.close();
    }
  };

  const runHook = async ({
    hookData,
  }: {
    hookData: unknown;
  }): Promise<ReturnType<typeof ExecResultStub>> => {
    if (!child) {
      throw new Error('Worker not started. Call start() first.');
    }

    return new Promise((resolve, reject) => {
      responseQueue.push({ resolve, reject });
      child!.stdin!.write(`${JSON.stringify(hookData)}\n`);
    });
  };

  return { start, stop, runHook };
};
