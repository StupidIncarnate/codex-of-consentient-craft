import { orchestratorBootstrapAdapter } from './orchestrator-bootstrap-adapter';
import { orchestratorBootstrapAdapterProxy } from './orchestrator-bootstrap-adapter.proxy';

describe('orchestratorBootstrapAdapter', () => {
  it('VALID: {} => returns the orchestrator bootstrap result', () => {
    const proxy = orchestratorBootstrapAdapterProxy();
    proxy.succeeds();

    const result = orchestratorBootstrapAdapter();

    expect(result).toStrictEqual({ success: true });
  });

  it('ERROR: {orchestrator throws} => throws error', () => {
    const proxy = orchestratorBootstrapAdapterProxy();
    proxy.throws({ error: new Error('bootstrap failed') });

    expect(() => orchestratorBootstrapAdapter()).toThrow(/^bootstrap failed$/u);
  });
});
