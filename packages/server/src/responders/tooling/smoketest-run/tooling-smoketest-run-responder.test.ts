import { ToolingSmoketestRunResponder } from './tooling-smoketest-run-responder';
import { ToolingSmoketestRunResponderProxy } from './tooling-smoketest-run-responder.proxy';

describe('ToolingSmoketestRunResponder', () => {
  it('ERROR: {body: {}} => returns 500 with invalid-suite error', async () => {
    ToolingSmoketestRunResponderProxy();

    const result = await ToolingSmoketestRunResponder({ body: {} });

    expect(result.status).toBe(500);
  });

  it('ERROR: {orchestrator throws "Smoketest already running"} => returns 409', async () => {
    const proxy = ToolingSmoketestRunResponderProxy();
    proxy.setupAlreadyRunning({ runId: 'run-123', suite: 'mcp' });

    const result = await ToolingSmoketestRunResponder({ body: { suite: 'signals' } });

    expect(result.status).toBe(409);
  });

  it('ERROR: {orchestrator throws other error} => returns 500 (not 409)', async () => {
    const proxy = ToolingSmoketestRunResponderProxy();
    proxy.setupRejectsWith({ error: new Error('boom') });

    const result = await ToolingSmoketestRunResponder({ body: { suite: 'mcp' } });

    expect(result.status).toBe(500);
  });
});
