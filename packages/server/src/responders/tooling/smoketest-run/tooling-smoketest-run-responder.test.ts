import { ToolingSmoketestRunResponder } from './tooling-smoketest-run-responder';
import { ToolingSmoketestRunResponderProxy } from './tooling-smoketest-run-responder.proxy';

describe('ToolingSmoketestRunResponder', () => {
  it('ERROR: {body: {}} => returns 500 with invalid-suite error', async () => {
    ToolingSmoketestRunResponderProxy();

    const result = await ToolingSmoketestRunResponder({ body: {} });

    expect(result.status).toBe(500);
  });
});
