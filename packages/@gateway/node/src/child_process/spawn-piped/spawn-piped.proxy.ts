import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, PassThrough, Writable, type Readable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// `ChildProcess.killed` is declared readonly, so a fake built by casting straight to `ChildProcess`
// can never assign it (TS2540). This interface keeps `killed`/`kill` writable on the fake itself;
// only the return value is cast to `ChildProcess`, which TypeScript allows because every one of
// `MockChild`'s own members is already assignable from a real `ChildProcess`.
interface MockChild extends EventEmitter {
  killed: boolean;
  kill: ChildProcess['kill'];
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
}

interface SpawnedChild {
  command: string;
  args: readonly string[];
  cwd: string;
  env: unknown;
  writtenText: { value: string };
  killCount: { value: number };
}

interface ChildControls {
  pushStdoutLine: (params: { line: string }) => void;
  pushStderrLine: (params: { line: string }) => void;
  exit: (params: { code: number | null; signal?: NodeJS.Signals }) => void;
}

// `spawn(command, args, options)` is the real call this proxy mocks. The address is the command, the
// exact args array and a predicate keyed on the cwd the test supplies, so two callers of one binary
// stage apart by whichever of args or cwd differs.
export const spawnPipedProxy = (): {
  setupChild: (params: { command: string; args: string[]; cwd: string }) => ChildControls;
  getWrittenLinesFor: (params: { command: string; args: string[]; cwd: string }) => string[];
  getKillCountFor: (params: { command: string; args: string[]; cwd: string }) => number;
  getSpawnedEnvFor: (params: { command: string; args: string[]; cwd: string }) => unknown;
  getCallsFor: (params: { command: string; args: string[]; cwd: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: spawn });
  const spawned: SpawnedChild[] = [];

  const findLast = ({
    command,
    args,
    cwd,
  }: {
    command: string;
    args: string[];
    cwd: string;
  }): SpawnedChild | undefined =>
    spawned
      .filter(
        (entry) =>
          entry.command === command &&
          entry.cwd === cwd &&
          entry.args.length === args.length &&
          entry.args.every((arg, index) => arg === args[index]),
      )
      .at(-1);

  return {
    setupChild: ({ command, args, cwd }): ChildControls => {
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      const child = new EventEmitter() as MockChild;
      const writtenText = { value: '' };
      const killCount = { value: 0 };

      child.killed = false;
      child.stdout = stdout;
      child.stderr = stderr;
      child.stdin = new Writable({
        write(chunk: Buffer, _encoding, done): void {
          writtenText.value += chunk.toString();
          done();
        },
      });
      child.kill = ((): boolean => {
        killCount.value += 1;
        child.killed = true;
        return true;
      }) as ChildProcess['kill'];

      handle
        .calledWith([
          command,
          args,
          (options: unknown): boolean => (options as { cwd?: string }).cwd === cwd,
        ])
        .implement((...callArgs: unknown[]): ChildProcess => {
          spawned.push({
            command,
            args,
            cwd,
            env: (callArgs[2] as { env?: unknown }).env,
            writtenText,
            killCount,
          });
          return child as ChildProcess;
        });

      return {
        pushStdoutLine: ({ line }): void => {
          stdout.write(`${line}\n`);
        },
        pushStderrLine: ({ line }): void => {
          stderr.write(`${line}\n`);
        },
        exit: ({ code, signal }): void => {
          stdout.end();
          stderr.end();
          child.emit('close', code, signal ?? null);
        },
      };
    },

    getWrittenLinesFor: (params): string[] => {
      const text = findLast(params)?.writtenText.value ?? '';
      return text === '' ? [] : text.replace(/\n$/u, '').split('\n');
    },

    getKillCountFor: (params): number => findLast(params)?.killCount.value ?? 0,

    getSpawnedEnvFor: (params): unknown => findLast(params)?.env,

    getCallsFor: ({ command, args, cwd }): readonly unknown[][] =>
      handle.callsMatching([
        command,
        args,
        (options: unknown): boolean => (options as { cwd?: string }).cwd === cwd,
      ]),
  };
};
