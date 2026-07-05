import { orchestratorGetOrchestrationModeAdapter } from './orchestrator-get-orchestration-mode-adapter';
import { orchestratorGetOrchestrationModeAdapterProxy } from './orchestrator-get-orchestration-mode-adapter.proxy';

describe('orchestratorGetOrchestrationModeAdapter', () => {
  it('VALID: {} => returns OrchestrationMode', async () => {
    const proxy = orchestratorGetOrchestrationModeAdapterProxy();
    proxy.returns({ mode: 'node' });

    const result = await orchestratorGetOrchestrationModeAdapter();

    expect(result).toBe('node');
  });

  it('ERROR: {orchestrator throws} => throws error', async () => {
    const proxy = orchestratorGetOrchestrationModeAdapterProxy();
    proxy.throws({ error: new Error('read failed') });

    await expect(orchestratorGetOrchestrationModeAdapter()).rejects.toThrow(/^read failed$/u);
  });
});
