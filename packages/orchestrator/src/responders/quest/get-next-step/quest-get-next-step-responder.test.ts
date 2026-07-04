import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { QuestGetNextStepResponderProxy } from './quest-get-next-step-responder.proxy';

describe('QuestGetNextStepResponder', () => {
  it('VALID: {broker returns idle} => returns idle and records the MCP heartbeat', async () => {
    const proxy = QuestGetNextStepResponderProxy();
    proxy.setupBrokerReturns({ step: { type: 'idle' } });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({ type: 'idle' });
    expect(proxy.getHeartbeatCalls()).toStrictEqual([[]]);
  });

  it('VALID: {node dispatcher playing} => returns forced idle with reason, no heartbeat, no scan', async () => {
    const proxy = QuestGetNextStepResponderProxy();
    proxy.setupDispatchMode({ mode: 'node-playing' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      type: 'idle',
      reason: orchestrationDispatchStatics.exclusivity.mcpIdleReason,
    });
    expect(proxy.getHeartbeatCalls()).toStrictEqual([]);
  });

  it('ERROR: {broker throws} => propagates error', async () => {
    const proxy = QuestGetNextStepResponderProxy();
    proxy.setupBrokerThrows({ error: new Error('Scan failed') });

    await expect(proxy.callResponder()).rejects.toThrow(/Scan failed/u);
  });
});
