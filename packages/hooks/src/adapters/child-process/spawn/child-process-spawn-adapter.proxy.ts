import type { SpawnOptions, ChildProcess } from 'child_process';

export const childProcessSpawnAdapterProxy = jest.fn<
  ChildProcess,
  [{ command: string; args?: string[]; options?: SpawnOptions }]
>();

jest.mock('./child-process-spawn-adapter', () => ({
  childProcessSpawnAdapter: childProcessSpawnAdapterProxy,
}));
