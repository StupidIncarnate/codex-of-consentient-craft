import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

jest.mock('child_process');

export const childProcessSpawnAdapterProxy = (): {
  setupSpawn: () => {
    stdout: EventEmitter;
    processEmitter: EventEmitter;
    fakeProcess: ChildProcess;
  };
  getSpawnCalls: () => jest.Mock;
} => {
  const mockSpawn = jest.mocked(spawn);

  mockSpawn.mockImplementation((() => {
    const emitter = new EventEmitter();
    return Object.assign(emitter, {
      stdout: new EventEmitter(),
      stderr: null,
      stdin: null,
      pid: 0,
      kill: jest.fn(),
      killed: false,
      connected: false,
      exitCode: null,
      signalCode: null,
      spawnargs: [],
      spawnfile: '',
      ref: jest.fn(),
      unref: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      stdio: [null, null, null, null, null],
      [Symbol.dispose]: jest.fn(),
    });
  }) as unknown as typeof spawn);

  return {
    setupSpawn: (): {
      stdout: EventEmitter;
      processEmitter: EventEmitter;
      fakeProcess: ChildProcess;
    } => {
      const stdout = new EventEmitter();
      const processEmitter = new EventEmitter();

      const fakeProcess = Object.assign(processEmitter, {
        stdout,
        stderr: null,
        stdin: null,
        pid: 12345,
        kill: jest.fn(),
        killed: false,
        connected: false,
        exitCode: null,
        signalCode: null,
        spawnargs: [],
        spawnfile: '',
        ref: jest.fn(),
        unref: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
        stdio: [null, stdout, null, null, null],
        [Symbol.dispose]: jest.fn(),
      }) as unknown as ChildProcess;

      mockSpawn.mockReturnValueOnce(fakeProcess);

      return { stdout, processEmitter, fakeProcess };
    },
    getSpawnCalls: (): jest.Mock => mockSpawn as unknown as jest.Mock,
  };
};
