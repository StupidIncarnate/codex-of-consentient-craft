import { debugDebugAdapter } from './debug-debug-adapter';
import { debugDebugAdapterProxy } from './debug-debug-adapter.proxy';
import type { Debugger } from 'debug';

describe('debugDebugAdapter', () => {
  it('should create debug logger with namespace', () => {
    const mockDebugger = (() => {}) as Debugger;
    debugDebugAdapterProxy.mockReturnValue(mockDebugger);

    const result = debugDebugAdapter({ namespace: 'questmaestro:test' });

    expect(result).toBe(mockDebugger);
    expect(debugDebugAdapterProxy).toHaveBeenCalledWith({
      namespace: 'questmaestro:test',
    });
  });
});
