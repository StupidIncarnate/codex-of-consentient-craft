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

  it('EDGE: {a pid exits between the readdir and the stat read, ENOENT} => returns 0 rather than throwing', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['105'] });
    proxy.setupPidStatVanished({ pid: '105', code: 'ENOENT' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 300 })] });

    expect(result).toBe(0);
  });

  it('EDGE: {a pid exits between the stat open and the stat read, ESRCH} => returns 0 rather than throwing', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['106'] });
    proxy.setupPidStatVanished({ pid: '106', code: 'ESRCH' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 300 })] });

    expect(result).toBe(0);
  });

  it('EDGE: {a pid exits between the stat read and the statm read, ENOENT} => returns 0 rather than throwing', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['108'] });
    proxy.setupPidStat({ pid: '108', pgrp: 300 });
    proxy.setupPidStatmVanished({ pid: '108', code: 'ENOENT' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 300 })] });

    expect(result).toBe(0);
  });

  it('EDGE: {a pid exits between the statm open and the statm read, ESRCH} => returns 0 rather than throwing', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['109'] });
    proxy.setupPidStat({ pid: '109', pgrp: 300 });
    proxy.setupPidStatmVanished({ pid: '109', code: 'ESRCH' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 300 })] });

    expect(result).toBe(0);
  });

  it('VALID: {one pid vanishes at the stat read, one vanishes at the statm read, one survives} => sums only the survivor’s real RSS', async () => {
    const proxy = machineRssByPgidBrokerProxy();
    proxy.setupProcListing({ pids: ['200', '201', '202'] });
    // Survivor: both reads succeed with real numbers.
    proxy.setupPidStat({ pid: '200', pgrp: 500, comm: 'node' });
    proxy.setupPidStatm({ pid: '200', residentPages: 3072 });
    // Vanishes before its pgrp is even known — an ESRCH read races the stat call itself.
    proxy.setupPidStatVanished({ pid: '201', code: 'ESRCH' });
    // Matches the target pgid, then vanishes before its statm read completes.
    proxy.setupPidStat({ pid: '202', pgrp: 500, comm: 'node' });
    proxy.setupPidStatmVanished({ pid: '202', code: 'ENOENT' });

    const result = await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub({ value: 500 })] });

    // 3072 pages * 4096 bytes/page / 1_048_576 bytes/MB = 12 MB exactly — the survivor alone.
    expect(result).toBe(12);
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
