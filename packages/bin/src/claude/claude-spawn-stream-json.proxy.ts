import { spawnLive } from '@dungeonmaster/node/child_process';
import type { ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { resolveClaudeCliPath } from './claude-resolve-cli-path';

const createMockChild = (): { child: ChildProcess; stdout: Readable } => {
  const child = new EventEmitter() as ChildProcess;
  const stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stdout = stdout;
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.kill = ((): boolean => true) as ChildProcess['kill'];
  return { child, stdout };
};

export const claudeSpawnStreamJsonProxy = (): {
  setupSuccess: (params: { cliPath: string }) => ChildProcess;
  setupCliPathThrows: (params: { error: Error }) => void;
  getSpawnedOptions: (params: { cliPath: string }) => unknown;
} => {
  const cliPathHandle = registerMock({ fn: resolveClaudeCliPath });
  const spawnLiveHandle = registerMock({ fn: spawnLive });

  return {
    setupSuccess: ({ cliPath }: { cliPath: string }): ChildProcess => {
      cliPathHandle.calledWith([]).returns(cliPath);

      const { child, stdout } = createMockChild();
      spawnLiveHandle
        .calledWith([{ command: cliPath }])
        .implement(() => ({ process: child, stdout }));

      return child;
    },

    setupCliPathThrows: ({ error }: { error: Error }): void => {
      cliPathHandle.calledWith([]).implement(() => {
        throw error;
      });
    },

    getSpawnedOptions: ({ cliPath }: { cliPath: string }): unknown =>
      spawnLiveHandle.callsMatching([{ command: cliPath }]).at(-1)?.[0],
  };
};
