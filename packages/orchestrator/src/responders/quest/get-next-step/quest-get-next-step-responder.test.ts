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

  describe('rate-limit guardrail', () => {
    it('VALID: {a hold stands} => returns forced idle naming the window and the resume time', async () => {
      const proxy = QuestGetNextStepResponderProxy();
      proxy.setupLiveHold();

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({
        type: 'idle',
        reason:
          'rate-limit guardrail: 7d window at 93% — dispatch holds until it resets. Dispatch resumes at 2099-01-01T00:00:00.000Z.',
      });
    });

    it('VALID: {a hold stands} => records no heartbeat, so the Node play gate is not held off by a stalled loop', async () => {
      const proxy = QuestGetNextStepResponderProxy();
      proxy.setupLiveHold();

      await proxy.callResponder();

      expect(proxy.getHeartbeatCalls()).toStrictEqual([]);
    });

    it('VALID: {a hold whose resumeAt has passed} => dispatches normally again with no user action', async () => {
      const proxy = QuestGetNextStepResponderProxy();
      proxy.setupExpiredHold();
      proxy.setupBrokerReturns({ step: { type: 'idle' } });

      const result = await proxy.callResponder();

      expect(result).toStrictEqual({ type: 'idle' });
      expect(proxy.getHeartbeatCalls()).toStrictEqual([[]]);
    });
  });
});
