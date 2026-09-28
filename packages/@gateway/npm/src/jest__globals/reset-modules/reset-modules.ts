/**
 * PURPOSE: Wraps `jest.resetModules` from `@jest/globals`'s own `jest` object — clears Jest's own
 * module registry so the next require/import of a module re-evaluates it, picking up any `doMock`
 * still registered for it instead of returning a previously cached instance.
 *
 * USAGE:
 * resetModules();
 * // The next require of a module Jest already evaluated runs its module body again
 */
import { jest } from '@jest/globals';

export const resetModules = (): ReturnType<typeof jest.resetModules> => jest.resetModules();
