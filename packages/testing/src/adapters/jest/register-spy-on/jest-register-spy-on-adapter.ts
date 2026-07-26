/**
 * PURPOSE: Wraps jest.spyOn for global object methods with the same argument-addressed dispatch as registerMock
 *
 * USAGE:
 * const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });
 * handle.calledWith(['hello']).returns(true);
 * // Internally calls jest.spyOn(object, method) and dispatches by argument, same as registerMock
 *
 * WHEN-TO-USE: When a proxy needs to spy on a global object method (process.stdout.write, Date.now, etc.)
 * WHEN-NOT-TO-USE: For module-imported functions — use registerMock({ fn }) instead
 */

import { mockFunctionNameContract } from '../../../contracts/mock-function-name/mock-function-name-contract';
import type { MockHandle } from '../../../contracts/mock-handle/mock-handle-contract';
import type { MockStaging } from '../../../contracts/mock-staging/mock-staging-contract';
import type { StagedCall } from '../../../contracts/staged-call/staged-call-contract';
import { mockArgsMatchTransformer } from '../../../transformers/mock-args-match/mock-args-match-transformer';
import { mockStagedBestMatchTransformer } from '../../../transformers/mock-staged-best-match/mock-staged-best-match-transformer';
import { mockStagingCreateTransformer } from '../../../transformers/mock-staging-create/mock-staging-create-transformer';
import { mockUnmatchedCallMessageTransformer } from '../../../transformers/mock-unmatched-call-message/mock-unmatched-call-message-transformer';

export type SpyOnHandle = MockHandle;

type AnyFunction = (...args: unknown[]) => unknown;

const DISPATCHER = Symbol('registerSpyOnDispatcher');

const realsBySpy = new WeakMap<object, AnyFunction>();
const stagedBySpy = new WeakMap<object, StagedCall[]>();
const callsBySpy = new WeakMap<object, unknown[][]>();

export const jestRegisterSpyOnAdapter = <T extends object>({
  object,
  method,
  passthrough = false,
}: {
  object: T;
  method: keyof T & string;
  passthrough?: boolean;
}): SpyOnHandle => {
  const realBeforeSpy = object[method] as unknown as AnyFunction;
  const spy = jest.spyOn(object, method as never);

  const currentImpl =
    typeof spy.getMockImplementation === 'function' ? spy.getMockImplementation() : undefined;

  const isDispatcher =
    currentImpl !== undefined &&
    (currentImpl as unknown as Record<symbol, boolean>)[DISPATCHER] === true;

  if (!isDispatcher) {
    realsBySpy.set(spy, realBeforeSpy);
    stagedBySpy.set(spy, []);
    callsBySpy.set(spy, []);

    spy.mockImplementation(((...args: unknown[]): unknown => {
      callsBySpy.get(spy)?.push([...args]);

      const staged = stagedBySpy.get(spy) ?? [];
      const best = mockStagedBestMatchTransformer({ staged, actual: args });

      if (best) {
        if (best.once) {
          best.consumed = true;
        }

        return best.impl(...(args as never[]));
      }

      if (passthrough) {
        const real = realsBySpy.get(spy);
        const context = spy.mock.contexts.at(-1) as unknown;
        const receiver = context === null || context === undefined ? object : context;

        return real ? real.apply(receiver, args) : undefined;
      }

      throw new Error(
        mockUnmatchedCallMessageTransformer({
          name: mockFunctionNameContract.parse(method),
          args,
          staged,
        }),
      );
    }) as never);

    const installedImpl = spy.getMockImplementation();

    if (installedImpl) {
      (installedImpl as unknown as Record<symbol, boolean>)[DISPATCHER] = true;
    }
  }

  const handle: MockHandle = {
    calledWith: (args: readonly unknown[]): MockStaging => {
      const staged = stagedBySpy.get(spy) ?? [];
      const record: StagedCall = { args, impl: () => undefined, once: false, consumed: false };

      staged.push(record);
      stagedBySpy.set(spy, staged);

      return mockStagingCreateTransformer({ record });
    },
    onceFor: (args: readonly unknown[]): MockStaging => {
      const staging = handle.calledWith(args);
      const record = stagedBySpy.get(spy)?.at(-1);

      if (record) {
        record.once = true;
      }

      return staging;
    },
    callsMatching: (args: readonly unknown[]): unknown[][] =>
      (callsBySpy.get(spy) ?? []).filter(
        (call) => mockArgsMatchTransformer({ staged: args, actual: call }) !== null,
      ),
  };

  return handle;
};
