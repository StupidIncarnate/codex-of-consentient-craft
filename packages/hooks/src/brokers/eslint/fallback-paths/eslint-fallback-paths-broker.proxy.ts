/**
 * PURPOSE: Proxy for eslint-fallback-paths-broker that sets up path resolution mocking
 *
 * USAGE:
 * const proxy = eslintFallbackPathsBrokerProxy();
 * const paths = eslintFallbackPathsBroker({ cwd: '/project/.test-tmp/foo' });
 */
import { resolve } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// Extracted to avoid inline type assertion in broker file
const segmentToText = (segment: never): [boolean, unknown] => {
  const text = segment as unknown;
  const value = `${text as undefined}`;
  return [value.startsWith('/'), text];
};

export const eslintFallbackPathsBrokerProxy = (): Record<PropertyKey, never> => {
  const handle = registerMock({ fn: resolve });

  // Restore real path.resolve behavior since this broker depends on actual path traversal
  handle.calledWith([]).implement((...segments) => {
    const parts = [] as never[];
    for (const segment of segments) {
      const [isAbsolute, value] = segmentToText(segment);
      if (isAbsolute) {
        parts.length = 0;
      }
      for (const part of `${value as undefined}`.split('/')) {
        if (part === '..') {
          parts.pop();
        } else if (part !== '' && part !== '.') {
          (parts as unknown[]).push(part);
        }
      }
    }
    return `/${(parts as unknown[]).join('/')}`;
  });

  return {};
};
