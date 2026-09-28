/**
 * PURPOSE: A real jest Mock function, minted through this subpath's own `fn` wrapper — for a
 * caller staging a function-shaped field with a real mock instead of hand-typing `jest.fn()`.
 *
 * USAGE:
 * const handler = MockFunctionStub();
 * handler.mockReturnValue(42);
 * // A real jest.Mock, trackable via .mock.calls like any other jest.fn() result
 */
import { fn } from '../fn/fn';

export const MockFunctionStub = (): ReturnType<typeof fn> => fn();
