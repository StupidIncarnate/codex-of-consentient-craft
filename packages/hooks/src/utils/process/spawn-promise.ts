import { childProcessSpawn } from '../../adapters/child_process/child-process-spawn';

export interface SpawnResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface SpawnPromiseParams {
  command: string;
  args: string[];
  cwd?: string;
  stdin?: string;
  timeout?: number;
}

const DEFAULT_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

class SpawnExecutor {
  private resolveCallback?: (value: SpawnResult) => void;
  private rejectCallback?: (reason: Error) => void;

  public setCallbacks(callbacks: {
    resolve: (value: SpawnResult) => void;
    reject: (reason: Error) => void;
  }): void {
    this.resolveCallback = callbacks.resolve;
    this.rejectCallback = callbacks.reject;
  }

  public execute(params: SpawnPromiseParams): void {
    const { command, args, cwd, stdin, timeout } = params;
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
            this.reject(new Error(`Process timed out after ${timeout}ms`));
          }, timeout);

    child.stdout?.on('data', (data) => {
      stdout += data;
    });

    child.stderr?.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      if (!timedOut) {
        this.resolve({ code: code ?? DEFAULT_EXIT_CODE, stdout, stderr });
      }
    });

    child.on('error', (error) => {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      if (!timedOut) {
        this.resolve({ code: ERROR_EXIT_CODE, stdout: '', stderr: error.message });
      }
    });

    if (stdin !== undefined && stdin !== '') {
      child.stdin?.write(stdin);
      child.stdin?.end();
    }
  }

  private resolve(value: SpawnResult): void {
    if (this.resolveCallback !== undefined) {
      this.resolveCallback(value);
    }
  }

  private reject(reason: Error): void {
    if (this.rejectCallback !== undefined) {
      this.rejectCallback(reason);
    }
  }
}

export const spawnPromise = async (params: SpawnPromiseParams): Promise<SpawnResult> => {
  const executor = new SpawnExecutor();
  const promise = new Promise<SpawnResult>((promiseResolver, promiseRejector) => {
    const resolve = (value: SpawnResult): void => {
      promiseResolver(value);
    };
    const reject = (reason: Error): void => {
      promiseRejector(reason);
    };
    executor.setCallbacks({ resolve, reject });
  });
  executor.execute(params);
  return promise;
};
