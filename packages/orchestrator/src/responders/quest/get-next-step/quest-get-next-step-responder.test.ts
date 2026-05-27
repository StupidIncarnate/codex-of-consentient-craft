import { QuestGetNextStepResponderProxy } from './quest-get-next-step-responder.proxy';

describe('QuestGetNextStepResponder', () => {
  it('VALID: {broker returns idle} => returns idle', async () => {
    const proxy = QuestGetNextStepResponderProxy();
    proxy.setupBrokerReturns({ step: { type: 'idle' } });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({ type: 'idle' });
  });

  it('ERROR: {broker throws} => propagates error', async () => {
    const proxy = QuestGetNextStepResponderProxy();
    proxy.setupBrokerThrows({ error: new Error('Scan failed') });

    await expect(proxy.callResponder()).rejects.toThrow(/Scan failed/u);
  });
});
