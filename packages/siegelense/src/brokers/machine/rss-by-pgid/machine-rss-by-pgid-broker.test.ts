import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

import { machineRssByPgidBroker } from './machine-rss-by-pgid-broker';
import { machineRssByPgidBrokerProxy } from './machine-rss-by-pgid-broker.proxy';

describe('machineRssByPgidBroker', () => {
  it('VALID: {two pids in the pgid, one outside} => returns only the two summed', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101', '102'] });
    // A comm field with a space AND an embedded ')' — the classic trap for a naive
    // whitespace-split parse, which the last-')' read must survive unaffected.
    proxy.setupPidStat({ pid: '100', pgrp: 200, comm: 'code --wait (renderer) helper' });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });
    proxy.setupPidStat({ pid: '101', pgrp: 200, comm: 'node' });
    proxy.setupPidStatm({ pid: '101', residentPages: 1280 });
    // Outside the target pgid — its statm is never staged, proving the broker never reads it.
    proxy.setupPidStat({ pid: '102', pgrp: 999, comm: 'chrome' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 200 })] });

    // (2560 + 1280) pages * 4096 bytes/page / 1_048_576 bytes/MB = 15 MB exactly.
    expect(result).toBe(15);
  });

  it('EMPTY: {/proc is absent} => returns null', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcMissing();

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 200 })] });

    expect(result).toBe(null);
  });

  it('EDGE: {pgids: []} => returns 0', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['100'] });
    proxy.setupPidStat({ pid: '100', pgrp: 200 });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });

    const result = await machineRssByPgidBroker({ pgids: [] });

    expect(result).toBe(0);
  });

  it('EDGE: {a pid exits between the readdir and the stat read} => returns 0 rather than throwing', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['105'] });
    proxy.setupPidStatVanished({ pid: '105' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 300 })] });

    expect(result).toBe(0);
  });

  it('ERROR: {stat read fails for a reason other than absence} => rejects rather than treating it as vanished', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['107'] });
    proxy.setupPidStatFails({
      pid: '107',
      error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
    });

    await expect(
      machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 300 })] }),
    ).rejects.toThrow('Failed to read file at /proc/107/stat');
  });
});
