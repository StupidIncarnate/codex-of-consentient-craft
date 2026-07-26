import { requireActual } from '@dungeonmaster/testing/register-mock';
import type { Debugger } from 'debug';

import { debugDebugAdapter } from './debug-debug-adapter';
import { debugDebugAdapterProxy } from './debug-debug-adapter.proxy';

describe('debugDebugAdapter', () => {
  it('VALID: {namespace: "dungeonmaster:test"} => returns debug logger', () => {
    const proxy = debugDebugAdapterProxy();
    // debug('test') here would call the SAME mocked function debugDebugAdapter calls — go
    // through the real module to build a genuine Debugger fixture instead.
    const { default: realDebug } = requireActual<{ default: (namespace: string) => Debugger }>({
      module: 'debug',
    });
    const mockLogger = realDebug('test');
    proxy.returns({ namespace: 'dungeonmaster:test', logger: mockLogger });

    const result = debugDebugAdapter({ namespace: 'dungeonmaster:test' });

    expect(result).toBe(mockLogger);
  });
});
