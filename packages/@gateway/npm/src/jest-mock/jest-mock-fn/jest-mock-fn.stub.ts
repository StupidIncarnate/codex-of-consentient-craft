/**
 * PURPOSE: A real jest Mock function, minted through jest-mock's own `fn()` — for a caller staging
 * a function-shaped field with a real mock built from the raw package this subpath wraps.
 *
 * USAGE:
 * const handler = JestMockFnStub();
 * handler.mockReturnValue(42);
 * // A real jest-mock Mock, trackable via .mock.calls like any other jest-mock fn() result
 */
import { fn } from 'jest-mock';

export const JestMockFnStub = (): ReturnType<typeof fn> => fn();
