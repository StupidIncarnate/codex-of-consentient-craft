import { DebuggerStub } from './debugger.stub';

describe('DebuggerStub', () => {
  it('VALID: {} => a real Debugger for the default namespace', () => {
    const log = DebuggerStub();

    expect(log.namespace).toBe('gateway-stub');
  });

  it('VALID: {namespace} => a real Debugger for the given namespace', () => {
    const log = DebuggerStub({ namespace: 'gateway-stub-other' });

    expect(log.namespace).toBe('gateway-stub-other');
  });
});
