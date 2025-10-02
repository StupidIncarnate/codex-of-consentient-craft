import { childProcessSpawn } from '../child_process/child-process-spawn';

export interface SpawnResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface ChildProcessSpawnPromiseParams {
  command: string;
  args: string[];
  cwd?: string;
  stdin?: string;
  timeout?: number;
}

const DEFAULT_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

export const childProcessSpawnPromise = async ({
  command,
  args,
  cwd,
  stdin,
  timeout,
}: ChildProcessSpawnPromiseParams): Promise<SpawnResult> =>
  new Promise<SpawnResult>((resolve, reject) => {
    const child = childProcessSpawn({
      command,
      args,
      options: {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: cwd ?? process.cwd(),
      },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutHandle =
      timeout === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
            reject(new Error(`Process timed out after ${timeout}ms`));
          }, timeout);

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code: number | null) => {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      if (!timedOut) {
        resolve({ code: code ?? DEFAULT_EXIT_CODE, stdout, stderr });
      }
    });

    child.on('error', (error: Error) => {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      if (!timedOut) {
        resolve({ code: ERROR_EXIT_CODE, stdout: '', stderr: error.message });
      }
    });

    if (stdin !== undefined && stdin !== '') {
      child.stdin?.write(stdin);
      child.stdin?.end();
    }
  });
