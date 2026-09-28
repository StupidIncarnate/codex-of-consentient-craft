/**
 * PURPOSE: Wraps `jest.requireActual` from `@jest/globals`'s own `jest` object — the real module,
 * bypassing every mock registered for it. Reach for this from inside a proxy that needs the real
 * implementation of something a sibling proxy mocked. Returns `unknown`: the gateway cannot import
 * a caller's own module types, so the caller casts or re-parses what comes back.
 *
 * USAGE:
 * const realPath = requireActual({ moduleName: 'node:path' }) as typeof import('node:path');
 * realPath.join('a', 'b'); // the real path.join, never a mock
 */
import { jest } from '@jest/globals';

export const requireActual = ({ moduleName }: { moduleName: string }): unknown =>
  jest.requireActual(moduleName);
