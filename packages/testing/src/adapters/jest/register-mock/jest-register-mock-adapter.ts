/**
 * PURPOSE: Stack-based mock dispatch so multiple proxies can mock the same jest.fn without collision
 *
 * USAGE:
 * const handle = jestRegisterMockAdapter({ fn: execFile });
 * handle.mockImplementation((_cmd, _args, _opts, cb) => cb(null, '', ''));
 * // callerPath auto-derived from call stack; each proxy gets its own independent handle
 */

import { mockCallerPathContract } from '../../../contracts/mock-caller-path/mock-caller-path-contract';
import type { MockHandleEntry } from '../../../contracts/mock-handle-entry/mock-handle-entry-contract';

export interface MockHandle {
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

type MockFunction = (...args: never[]) => unknown;

type EntryImpl = MockHandleEntry['baseImpl'];
type EntryOnceQueue = MockHandleEntry['onceQueue'];

type JestMockLike = MockFunction & {
  getMockImplementation?: () => MockFunction | undefined;
  mockImplementation?: (impl: MockFunction) => void;
};

const DISPATCHER = Symbol('registerMockDispatcher');

const handlesByMock = new WeakMap<object, MockHandleEntry[]>();
const realsByMock = new WeakMap<object, MockFunction>();

export const jestRegisterMockAdapter = ({ fn }: { fn: MockFunction }): MockHandle => {
  // Auto-derive callerPath from call stack (frame 2 = caller of this function)
  const callerStack = new Error().stack ?? '';
  const callerLines = callerStack.split('\n');
  const callerLine = callerLines[2] ?? '';
  let callerPath = '';
  let pathStart = callerLine.lastIndexOf('/');

  if (pathStart < 0) {
    pathStart = callerLine.lastIndexOf('\\');
  }

  if (pathStart >= 0) {
    const afterSlash = callerLine.substring(pathStart + 1);
    let fileEnd = afterSlash.indexOf(':');

    if (fileEnd < 0) {
      fileEnd = afterSlash.indexOf(')');
    }

    if (fileEnd < 0) {
      fileEnd = afterSlash.length;
    }

    const filename = afterSlash.substring(0, fileEnd);

    // Strip .proxy.ts / .proxy.js / .ts / .js suffix to get adapter basename
    if (filename.includes('.proxy.ts')) {
      callerPath = filename.substring(0, filename.lastIndexOf('.proxy.ts'));
    } else if (filename.includes('.proxy.js')) {
      callerPath = filename.substring(0, filename.lastIndexOf('.proxy.js'));
    } else if (filename.includes('.ts')) {
      callerPath = filename.substring(0, filename.lastIndexOf('.ts'));
    } else if (filename.includes('.js')) {
      callerPath = filename.substring(0, filename.lastIndexOf('.js'));
    } else {
      callerPath = filename;
    }
  }

  const mock = fn as JestMockLike;

  const currentImpl =
    typeof mock.getMockImplementation === 'function' ? mock.getMockImplementation() : undefined;

  const isDispatcher =
    currentImpl !== undefined &&
    (currentImpl as unknown as Record<symbol, boolean>)[DISPATCHER] === true;

  if (!isDispatcher) {
    if (!realsByMock.has(mock)) {
      if (currentImpl) {
        realsByMock.set(mock, currentImpl);
      }
    }

    handlesByMock.set(mock, []);

    if (typeof mock.mockImplementation === 'function') {
      mock.mockImplementation(((...args: unknown[]): unknown => {
        const handles = handlesByMock.get(mock);

        if (!handles) {
          return undefined;
        }

        const stack = new Error().stack ?? '';
        const lines = stack.split('\n');

        // Stack-based routing: find which adapter file is calling
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];

          if (!line) {
            continue;
          }

          for (const handle of handles) {
            if (handle.callerPath && line.includes(handle.callerPath)) {
              handle.calls.push([...args]);

              if (handle.onceQueue.length > 0) {
                const onceFn = handle.onceQueue.shift();

                if (onceFn) {
                  return onceFn(...args);
                }
              }

              if (handle.baseImpl) {
                return handle.baseImpl(...args);
              }

              return undefined;
            }
          }
        }

        // No stack match — try catch-all handle (empty callerPath)
        for (const h of handles) {
          if (!h.callerPath) {
            h.calls.push([...args]);

            if (h.onceQueue.length > 0) {
              const onceFn = h.onceQueue.shift();

              if (onceFn) {
                return onceFn(...args);
              }
            }

            if (h.baseImpl) {
              return h.baseImpl(...args);
            }

            return undefined;
          }
        }

        // Passthrough to real impl
        const real = realsByMock.get(mock);

        if (real) {
          return real(...(args as never[]));
        }

        return undefined;
      }) as MockFunction);

      const impl = mock.getMockImplementation?.();

      if (impl) {
        (impl as unknown as Record<symbol, boolean>)[DISPATCHER] = true;
      }
    }
  }

  const parsedCallerPath = mockCallerPathContract.parse(callerPath);
  const handles = handlesByMock.get(mock);

  // Reuse existing entry when same callerPath is registered multiple times
  // This happens when multiple sub-proxies independently create the same adapter proxy
  const existingEntry = handles?.find((h) => h.callerPath === parsedCallerPath);

  const entry: MockHandleEntry = existingEntry ?? {
    callerPath: parsedCallerPath,
    baseImpl: null,
    onceQueue: [],
    calls: [],
  };

  if (handles && !existingEntry) {
    handles.push(entry);
  }

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
