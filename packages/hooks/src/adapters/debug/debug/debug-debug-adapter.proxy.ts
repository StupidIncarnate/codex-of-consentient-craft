import type { Debugger } from 'debug';

export const debugDebugAdapterProxy = jest.fn<Debugger, [{ namespace: string }]>();

jest.mock('./debug-debug-adapter', () => ({
  debugDebugAdapter: debugDebugAdapterProxy,
}));
