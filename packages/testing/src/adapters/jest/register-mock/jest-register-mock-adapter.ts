/**
 * PURPOSE: Stack-based mock dispatch so multiple proxies can mock the same jest.fn without collision
 *
 * USAGE:
 * const handle = jestRegisterMockAdapter({ fn: readFile });
 * handle.calledWith(['/a/quest.json']).resolves(questJson);
 * handle.calledWith(['/a/manifest.json']).resolves(manifestJson);
 * // Answers are addressed by the arguments, so every caller in the chain reading a path agrees
 *
 * Argument staging is shared across every proxy that mocks this function — one function, one
 * behaviour, the way prod behaves. Once any argument staging exists, a call whose arguments match
 * nothing throws instead of silently falling through, unless the proxy declared a base default.
 */

import { mockCallerPathContract } from '../../../contracts/mock-caller-path/mock-caller-path-contract';
import type { MockHandleEntry } from '../../../contracts/mock-handle-entry/mock-handle-entry-contract';
import { mockArgsMatchTransformer } from '../../../transformers/mock-args-match/mock-args-match-transformer';

export interface MockStaging {
  returns: (val: unknown) => void;
  resolves: (val: unknown) => void;
  rejects: (val: unknown) => void;
  throws: (val: unknown) => void;
  implement: (impl: (...args: never[]) => unknown) => void;
}

export interface MockHandle {
  calledWith: (args: readonly unknown[]) => MockStaging;
  onceFor: (args: readonly unknown[]) => MockStaging;
  callsMatching: (args: readonly unknown[]) => unknown[][];
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

export interface StagedCall {
  args: readonly unknown[];
  impl: (...args: never[]) => unknown;
  once: boolean;
  consumed: boolean;
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
const stagedByMock = new WeakMap<object, StagedCall[]>();
const callsByMock = new WeakMap<object, unknown[][]>();

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
    stagedByMock.set(mock, []);
    callsByMock.set(mock, []);

    if (typeof mock.mockImplementation === 'function') {
      mock.mockImplementation(((...args: unknown[]): unknown => {
        const handles = handlesByMock.get(mock);

        if (!handles) {
          return undefined;
        }

        callsByMock.get(mock)?.push([...args]);

        const staged = stagedByMock.get(mock) ?? [];

        // Higher specificity wins. At equal specificity the later staging wins, so a test
        // overrides a proxy default — except that a live one-shot outranks a sticky staging.
        const best = staged.reduce<StagedCall | undefined>((winner, candidate) => {
          const score =
            candidate.once && candidate.consumed
              ? null
              : mockArgsMatchTransformer({ staged: candidate.args, actual: args });

          if (score === null) {
            return winner;
          }

          if (winner === undefined) {
            return candidate;
          }

          const winnerScore = mockArgsMatchTransformer({ staged: winner.args, actual: args }) ?? -1;

          return score > winnerScore || (score === winnerScore && !winner.once)
            ? candidate
            : winner;
        }, undefined);

        const stack = new Error().stack ?? '';
        const lines = stack.split('\n');

        // Stack-based routing: find which adapter file is calling
        const callerLineMatch = lines
          .slice(1)
          .find((line) =>
            handles.some(
              (handleEntry) => handleEntry.callerPath && line.includes(handleEntry.callerPath),
            ),
          );

        const matchedHandle =
          callerLineMatch === undefined
            ? undefined
            : handles.find(
                (handleEntry) =>
                  handleEntry.callerPath && callerLineMatch.includes(handleEntry.callerPath),
              );

        const routed = matchedHandle ?? handles.find((handleEntry) => !handleEntry.callerPath);

        routed?.calls.push([...args]);

        if (best) {
          if (best.once) {
            best.consumed = true;
          }

          return best.impl(...(args as never[]));
        }

        const hasFallback =
          routed !== undefined && (routed.onceQueue.length > 0 || routed.baseImpl);

        if (staged.length > 0 && !hasFallback) {
          throw new Error(
            [
              `registerMock: no staged response for ${mock.name || 'mock'}(`,
              args
                .map((value) =>
                  typeof value === 'function' ? '<predicate>' : JSON.stringify(value),
                )
                .join(', '),
              '). Staged: ',
              staged
                .map(
                  (entry) =>
                    `(${entry.args
                      .map((value) =>
                        typeof value === 'function' ? '<predicate>' : JSON.stringify(value),
                      )
                      .join(', ')})`,
                )
                .join(' | '),
            ].join(''),
          );
        }

        if (routed) {
          if (routed.onceQueue.length > 0) {
            const onceFn = routed.onceQueue.shift();

            if (onceFn) {
              return onceFn(...args);
            }
          }

          if (routed.baseImpl) {
            return routed.baseImpl(...args);
          }

          return undefined;
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

  const handle: MockHandle = {
    calledWith: (args: readonly unknown[]): MockStaging => {
      const staged = stagedByMock.get(mock) ?? [];
      const record: StagedCall = { args, impl: () => undefined, once: false, consumed: false };

      staged.push(record);
      stagedByMock.set(mock, staged);

      return {
        returns: (val: unknown): void => {
          record.impl = () => val;
        },
        resolves: (val: unknown): void => {
          record.impl = async () => Promise.resolve(val);
        },
        rejects: (val: unknown): void => {
          const reason = val instanceof Error ? val : new Error(String(val));
          record.impl = async () => Promise.reject(reason);
        },
        throws: (val: unknown): void => {
          const reason = val instanceof Error ? val : new Error(String(val));
          record.impl = () => {
            throw reason;
          };
        },
        implement: (impl: (...args: never[]) => unknown): void => {
          record.impl = impl;
        },
      };
    },
    onceFor: (args: readonly unknown[]): MockStaging => {
      const staging = handle.calledWith(args);
      const record = stagedByMock.get(mock)?.at(-1);

      if (record) {
        record.once = true;
      }

      return staging;
    },
    callsMatching: (args: readonly unknown[]): unknown[][] =>
      (callsByMock.get(mock) ?? []).filter(
        (call) => mockArgsMatchTransformer({ staged: args, actual: call }) !== null,
      ),
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

  return handle;
};
