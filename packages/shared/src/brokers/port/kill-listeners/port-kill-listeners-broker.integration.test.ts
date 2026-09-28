/**
 * PURPOSE: Proves portKillListenersBroker against a real listener: a child process binds a real
 * port, the broker runs over the real lsof and kill binaries, and the port is free afterwards.
 */

import { portListenerHarness } from '../../../../test/harnesses/port-listener/port-listener.harness';
import { portKillListenersBroker } from './port-kill-listeners-broker';

describe('portKillListenersBroker (integration with real lsof and kill)', () => {
  const harness = portListenerHarness();

  it('VALID: {a real process listening on the port} => kills it and the port is free again', async () => {
    const port = await harness.start();
    const listening = await harness.waitForPortState({ port, free: false });

    const results = await portKillListenersBroker({ port });
    const freedAfterKill = await harness.waitForPortState({ port, free: true });

    expect({
      listening,
      killed: results.map(({ exitCode }) => exitCode),
      freedAfterKill,
    }).toStrictEqual({ listening: true, killed: [0], freedAfterKill: true });
  });

  it('EMPTY: {nothing listening on the port} => kills nothing and returns an empty array', async () => {
    const port = await harness.freePort();

    const results = await portKillListenersBroker({ port });

    expect(results).toStrictEqual([]);
  });
});
