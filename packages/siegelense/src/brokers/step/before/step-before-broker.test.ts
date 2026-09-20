import { stepBeforeBroker } from './step-before-broker';
import { stepBeforeBrokerProxy } from './step-before-broker.proxy';

describe('stepBeforeBroker', () => {
  it('VALID: {source: "window.__injected = true;"} => calls session.addInitScript and returns rendered reading', async () => {
    const proxy = stepBeforeBrokerProxy();
    const { session, getAddInitScriptCalls } = proxy.session();

    const result = await stepBeforeBroker({ session, source: 'window.__injected = true;' });

    expect(getAddInitScriptCalls()).toStrictEqual([[{ source: 'window.__injected = true;' }]]);
    expect(result).toBe('installed init script (25 chars)');
  });
});
