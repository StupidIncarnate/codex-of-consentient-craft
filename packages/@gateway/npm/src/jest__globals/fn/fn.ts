/**
 * PURPOSE: Wraps `jest.fn` from `@jest/globals`'s own `jest` object — the one call every other
 * jest__globals wrapper (and every proxy in the repo) reaches for to mint a fresh mock function.
 *
 * USAGE:
 * const handler = fn();
 * handler.mockReturnValue(42);
 */
import { jest } from '@jest/globals';

export const fn = ({
  implementation,
}: {
  implementation?: Parameters<typeof jest.fn>[0];
} = {}): ReturnType<typeof jest.fn> => jest.fn(implementation);
