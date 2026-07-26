import { SmoketestSuiteStub } from '@dungeonmaster/shared/contracts';

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
    const suite = SmoketestSuiteStub({ value: 'signals' });
    proxy.setupAlreadyRunning({ runId: 'run-123', suite });

    const result = await ToolingSmoketestRunResponder({ body: { suite } });

    expect(result.status).toBe(409);
  });

  it('ERROR: {orchestrator throws other error} => returns 500 (not 409)', async () => {
    const proxy = ToolingSmoketestRunResponderProxy();
    const suite = SmoketestSuiteStub();
    proxy.setupRejectsWith({ suite, error: new Error('boom') });

    const result = await ToolingSmoketestRunResponder({ body: { suite } });

    expect(result.status).toBe(500);
  });
});
