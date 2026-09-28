/**
 * PURPOSE: Wraps `jest.doMock` from `@jest/globals`'s own `jest` object. Unlike `jest.mock`,
 * `doMock` is never hoisted above the file's own imports — it registers the given factory for the
 * NEXT real `require`/`import` of that module, which is what lets a caller apply it from inside a
 * running test body rather than only at module-load time.
 *
 * USAGE:
 * doMock({ moduleName: 'child_process', factory: () => ({ spawn: fn() }) });
 * // The next require('child_process') resolves to the factory's return value
 */
import { jest } from '@jest/globals';

export const doMock = ({
  moduleName,
  factory,
  options,
}: {
  moduleName: string;
  factory?: () => unknown;
  options?: { virtual?: boolean };
}): ReturnType<typeof jest.doMock> => jest.doMock(moduleName, factory, options);
