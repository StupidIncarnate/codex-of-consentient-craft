import { processesStopLayerBroker } from './processes-stop-layer-broker';
import { processesStopLayerBrokerProxy } from './processes-stop-layer-broker.proxy';

describe('processesStopLayerBroker', () => {
  it('EMPTY: {pgids: []} => signals nothing and resolves', async () => {
    processesStopLayerBrokerProxy();

    await expect(processesStopLayerBroker({ pgids: [] })).resolves.toBe(undefined);
  });

  it('VALID: {group already gone} => sends it no signal at all', async () => {
    const proxy = processesStopLayerBrokerProxy();
    const pgid = 1_001;
    proxy.setupAlreadyGone({ pgid });

    await processesStopLayerBroker({ pgids: [pgid] });

    expect(proxy.getSignalsFor({ pgid })).toStrictEqual([]);
  });

  it('VALID: {group exits on SIGTERM} => sends SIGTERM only', async () => {
    const proxy = processesStopLayerBrokerProxy();
    const pgid = 1_001;
    proxy.setupExitsOnSigterm({ pgid });

    await processesStopLayerBroker({ pgids: [pgid] });

    expect(proxy.getSignalsFor({ pgid })).toStrictEqual(['SIGTERM']);
  });

  it('VALID: {one group exits on SIGTERM, one already gone} => signals only the live one', async () => {
    const proxy = processesStopLayerBrokerProxy();
    const livePgid = 1_001;
    const gonePgid = 1_002;
    proxy.setupExitsOnSigterm({ pgid: livePgid });
    proxy.setupAlreadyGone({ pgid: gonePgid });

    await processesStopLayerBroker({ pgids: [livePgid, gonePgid] });

    expect({
      live: proxy.getSignalsFor({ pgid: livePgid }),
      gone: proxy.getSignalsFor({ pgid: gonePgid }),
    }).toStrictEqual({ live: ['SIGTERM'], gone: [] });
  });

  it('VALID: {group ignores SIGTERM past the grace} => escalates to SIGKILL and resolves once it exits', async () => {
    const proxy = processesStopLayerBrokerProxy();
    const pgid = 1_001;
    proxy.setupExitsOnlyOnSigkill({ pgid });

    await processesStopLayerBroker({ pgids: [pgid] });

    expect(proxy.getSignalsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
  });

  it('ERROR: {group survives SIGKILL past killWaitMs} => throws naming the group and refuses to respawn', async () => {
    const proxy = processesStopLayerBrokerProxy();
    const pgid = 1_001;
    proxy.setupSurvivesSigkill({ pgid });

    await expect(processesStopLayerBroker({ pgids: [pgid] })).rejects.toThrow(
      /^Stopping lane processes for an instance reset failed: process groups 1001 were still alive 5000ms after SIGKILL, so nothing was respawned onto ports they may still hold\.$/u,
    );
    expect(proxy.getSignalsFor({ pgid })).toStrictEqual(['SIGTERM', 'SIGKILL']);
  });
});
