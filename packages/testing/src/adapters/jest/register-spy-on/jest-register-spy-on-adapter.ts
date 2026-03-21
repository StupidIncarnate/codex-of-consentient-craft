/**
 * PURPOSE: Wraps jest.spyOn for global object methods so proxy files never call jest.spyOn directly
 *
 * USAGE:
 * const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });
 * handle.mockImplementation(() => true);
 * // Internally calls jest.spyOn(object, method) and returns a MockHandle
 *
 * WHEN-TO-USE: When a proxy needs to spy on a global object method (process.stdout.write, Date.now, etc.)
 * WHEN-NOT-TO-USE: For module-imported functions — use registerMock({ fn }) instead
 */

import { mockCallerPathContract } from '../../../contracts/mock-caller-path/mock-caller-path-contract';
import type { MockHandleEntry } from '../../../contracts/mock-handle-entry/mock-handle-entry-contract';

type EntryImpl = MockHandleEntry['baseImpl'];
type EntryOnceQueue = MockHandleEntry['onceQueue'];

export interface SpyOnHandle {
  mockImplementation: (impl: (...args: never[]) => unknown) => void;
  mockImplementationOnce: (impl: (...args: never[]) => unknown) => void;
  mockReturnValue: (val: unknown) => void;
  mockReturnValueOnce: (val: unknown) => void;
  mockResolvedValue: (val: unknown) => void;
  mockResolvedValueOnce: (val: unknown) => void;
  mockRejectedValueOnce: (val: unknown) => void;
  mock: { calls: unknown[][] };
  mockClear: () => void;
}

export const jestRegisterSpyOnAdapter = <T extends object>({
  object,
  method,
  passthrough = false,
}: {
  object: T;
  method: keyof T & string;
  passthrough?: boolean;
}): SpyOnHandle => {
  const spy = jest.spyOn(object, method as never);

  if (passthrough) {
    return {
      mockImplementation: (impl: (...args: never[]) => unknown): void => {
        spy.mockImplementation(impl as never);
      },
      mockImplementationOnce: (impl: (...args: never[]) => unknown): void => {
        spy.mockImplementationOnce(impl as never);
      },
      mockReturnValue: (val: unknown): void => {
        spy.mockReturnValue(val as never);
      },
      mockReturnValueOnce: (val: unknown): void => {
        spy.mockReturnValueOnce(val as never);
      },
      mockResolvedValue: (val: unknown): void => {
        spy.mockResolvedValue(val as never);
      },
      mockResolvedValueOnce: (val: unknown): void => {
        spy.mockResolvedValueOnce(val as never);
      },
      mockRejectedValueOnce: (val: unknown): void => {
        const reason = val instanceof Error ? val : new Error(String(val));
        spy.mockRejectedValueOnce(reason as never);
      },
      mock: spy.mock as unknown as { calls: unknown[][] },
      mockClear: (): void => {
        spy.mockClear();
      },
    };
  }

  const entry: MockHandleEntry = {
    callerPath: mockCallerPathContract.parse(''),
    baseImpl: null,
    onceQueue: [],
    calls: [],
  };

  spy.mockImplementation(((...args: unknown[]): unknown => {
    entry.calls.push([...args]);

    if (entry.onceQueue.length > 0) {
      const onceFn = entry.onceQueue.shift();

      if (onceFn) {
        return onceFn(...args);
      }
    }

    if (entry.baseImpl) {
      return entry.baseImpl(...args);
    }

    return undefined;
  }) as never);

  return {
    mockImplementation: (impl: (...args: never[]) => unknown): void => {
      entry.baseImpl = impl as EntryImpl;
    },
    mockImplementationOnce: (impl: (...args: never[]) => unknown): void => {
      entry.onceQueue.push(impl as EntryOnceQueue extends (infer U)[] ? U : never);
    },
    mockReturnValue: (val: unknown): void => {
      entry.baseImpl = () => val;
    },
    mockReturnValueOnce: (val: unknown): void => {
      entry.onceQueue.push(() => val);
    },
    mockResolvedValue: (val: unknown): void => {
      entry.baseImpl = async () => Promise.resolve(val);
    },
    mockResolvedValueOnce: (val: unknown): void => {
      entry.onceQueue.push(async () => Promise.resolve(val));
    },
    mockRejectedValueOnce: (val: unknown): void => {
      const reason = val instanceof Error ? val : new Error(String(val));
      entry.onceQueue.push(async () => Promise.reject(reason));
    },
    mock: { calls: entry.calls },
    mockClear: (): void => {
      entry.calls.length = 0;
      entry.onceQueue.length = 0;
      entry.baseImpl = null;
    },
  };
};
