/**
 * PURPOSE: Wraps `jest.spyOn` from `@jest/globals`'s own `jest` object, so a caller reaches this
 * one member of Jest's mocking API through the gateway instead of the bare global `jest`. Constrains
 * `method` to a function-valued key of `T` the same way jest-mock's own `spyOn` overload does
 * (`MethodLikeKeys<T>`), so the call reaches the real overload with no cast. The rest of the `jest`
 * object's surface — `doMock`, `requireActual`, `isolateModulesAsync`, `resetModules`, `fn` — are
 * their own wrappers beside this one; nothing here re-implements Jest's own spy semantics.
 *
 * USAGE:
 * const spy = spyOn({ object: process.stdout, method: 'write' });
 * spy.mockImplementation(() => true);
 */
import { jest } from '@jest/globals';
import type { MethodLikeKeys } from '#gateway/npm/jest-mock';

export const spyOn = <T extends object, K extends MethodLikeKeys<T>>({
  object,
  method,
}: {
  object: T;
  method: K;
}): ReturnType<typeof jest.spyOn<T, K, Required<T>[K]>> => jest.spyOn(object, method);
