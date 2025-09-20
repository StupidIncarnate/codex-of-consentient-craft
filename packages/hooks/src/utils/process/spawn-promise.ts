import { spawn } from 'child_process';

export type SpawnResult = { code: number; stdout: string; stderr: string };

export const spawnPromise = async ({
  command,
  args,
  cwd,
  stdin,
  timeout,
}: {
  command: string;
  args: string[];
  cwd?: string;
  stdin?: string;
  timeout?: number;
}): Promise<SpawnResult> =>
  new Promise<SpawnResult>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: cwd || process.cwd(),
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutHandle =
      timeout &&
      setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        reject(new Error(`Process timed out after ${timeout}ms`));
      }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data;
    });

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (!timedOut) {
        resolve({ code: code || 0, stdout, stderr });
      }
    });

    child.on('error', (error) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (!timedOut) {
        resolve({ code: 1, stdout: '', stderr: error.message });
      }
    });

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
