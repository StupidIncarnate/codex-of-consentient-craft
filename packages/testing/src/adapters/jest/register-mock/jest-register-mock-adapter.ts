/**
 * PURPOSE: Argument-addressed mock dispatch shared by every proxy that mocks the same jest.fn — one function, one behaviour
 *
 * USAGE:
 * const handle = jestRegisterMockAdapter({ fn: readFile });
 * handle.calledWith(['/a/quest.json']).resolves(questJson);
 * handle.calledWith(['/a/manifest.json']).resolves(manifestJson);
 * // Answers are addressed by the arguments, so every caller in the chain reading a path agrees
 *
 * Argument staging is shared across every proxy that mocks this function — one function, one
 * behaviour, the way prod behaves. A call whose arguments match no staged description throws,
 * naming both what was asked for and what is staged.
 */

import { mockFunctionNameContract } from '../../../contracts/mock-function-name/mock-function-name-contract';
import type { MockHandle } from '../../../contracts/mock-handle/mock-handle-contract';
import type { MockStaging } from '../../../contracts/mock-staging/mock-staging-contract';
import type { StagedCall } from '../../../contracts/staged-call/staged-call-contract';
import { mockArgsMatchTransformer } from '../../../transformers/mock-args-match/mock-args-match-transformer';
import { mockStagedBestMatchTransformer } from '../../../transformers/mock-staged-best-match/mock-staged-best-match-transformer';
import { mockStagingCreateTransformer } from '../../../transformers/mock-staging-create/mock-staging-create-transformer';
import { mockUnmatchedCallMessageTransformer } from '../../../transformers/mock-unmatched-call-message/mock-unmatched-call-message-transformer';

type MockFunction = (...args: never[]) => unknown;

type JestMockLike = MockFunction & {
  getMockImplementation?: () => MockFunction | undefined;
  mockImplementation?: (impl: MockFunction) => void;
};

const DISPATCHER = Symbol('registerMockDispatcher');

const stagedByMock = new WeakMap<object, StagedCall[]>();
const callsByMock = new WeakMap<object, unknown[][]>();

export const jestRegisterMockAdapter = ({ fn }: { fn: MockFunction }): MockHandle => {
  const mock = fn as JestMockLike;

  const currentImpl =
    typeof mock.getMockImplementation === 'function' ? mock.getMockImplementation() : undefined;

  const isDispatcher =
    currentImpl !== undefined &&
    (currentImpl as unknown as Record<symbol, boolean>)[DISPATCHER] === true;

  if (!isDispatcher) {
    stagedByMock.set(mock, []);
    callsByMock.set(mock, []);

    if (typeof mock.mockImplementation === 'function') {
      mock.mockImplementation(((...args: unknown[]): unknown => {
        callsByMock.get(mock)?.push([...args]);

        const staged = stagedByMock.get(mock) ?? [];
        const best = mockStagedBestMatchTransformer({ staged, actual: args });

        if (best) {
          if (best.once) {
            best.consumed = true;
          }

          return best.impl(...(args as never[]));
        }

        throw new Error(
          mockUnmatchedCallMessageTransformer({
            name: mockFunctionNameContract.parse(mock.name || 'mock'),
            args,
            staged,
          }),
        );
      }) as MockFunction);

      const impl = mock.getMockImplementation?.();

      if (impl) {
        (impl as unknown as Record<symbol, boolean>)[DISPATCHER] = true;
      }
    }
  }

  const handle: MockHandle = {
    calledWith: (args: readonly unknown[]): MockStaging => {
      const staged = stagedByMock.get(mock) ?? [];
      const record: StagedCall = { args, impl: () => undefined, once: false, consumed: false };

      staged.push(record);
      stagedByMock.set(mock, staged);

      return mockStagingCreateTransformer({ record });
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
  };

  return handle;
};
