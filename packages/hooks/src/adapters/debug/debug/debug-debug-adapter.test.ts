import { debugDebugAdapter } from './debug-debug-adapter';
import { debugDebugAdapterProxy } from './debug-debug-adapter.proxy';
import debug from 'debug';

describe('debugDebugAdapter', () => {
  it('VALID: {namespace: "dungeonmaster:test"} => returns debug logger', () => {
    const proxy = debugDebugAdapterProxy();
    const mockLogger = debug('test');
    proxy.returns({ logger: mockLogger });

    const result = debugDebugAdapter({ namespace: 'dungeonmaster:test' });

    expect(result).toBe(mockLogger);
  });
});
