import { processesExitWaitLayerBroker } from './processes-exit-wait-layer-broker';
import { processesExitWaitLayerBrokerProxy } from './processes-exit-wait-layer-broker.proxy';

// Far past any real clock reading, so a wait staged with it polls until the groups are gone.
const FAR_FUTURE_MS = 9_999_999_999_999;

describe('processesExitWaitLayerBroker', () => {
  it('EMPTY: {pgids: []} => returns [] without polling', async () => {
    const proxy = processesExitWaitLayerBrokerProxy();

    const result = await processesExitWaitLayerBroker({ pgids: [], deadlineMs: FAR_FUTURE_MS });

    expect({ result, delays: proxy.getRequestedDelays() }).toStrictEqual({
      result: [],
      delays: [],
    });
  });

  it('VALID: {every group already gone} => returns [] without polling', async () => {
    const proxy = processesExitWaitLayerBrokerProxy();
    const pgid = 1_001;
    proxy.setupGone({ pgid });

    const result = await processesExitWaitLayerBroker({ pgids: [pgid], deadlineMs: FAR_FUTURE_MS });

    expect({ result, delays: proxy.getRequestedDelays() }).toStrictEqual({
      result: [],
      delays: [],
    });
  });

  it('VALID: {group alive on the first probe, gone on the second} => polls once at exitPollMs and returns []', async () => {
    const proxy = processesExitWaitLayerBrokerProxy();
    const pgid = 1_001;
    proxy.setupAliveThenGone({ pgid });

    const result = await processesExitWaitLayerBroker({ pgids: [pgid], deadlineMs: FAR_FUTURE_MS });

    expect({ result, delays: proxy.getRequestedDelays() }).toStrictEqual({
      result: [],
      delays: [100],
    });
  });

  it('EDGE: {one group gone, one still alive, deadline already past} => returns only the survivor', async () => {
    const proxy = processesExitWaitLayerBrokerProxy();
    const gonePgid = 1_001;
    const alivePgid = 1_002;
    proxy.setupGone({ pgid: gonePgid });
    proxy.setupAlive({ pgid: alivePgid });

    const result = await processesExitWaitLayerBroker({
      pgids: [gonePgid, alivePgid],
      deadlineMs: 0,
    });

    expect(result).toStrictEqual([1_002]);
  });
});
