import { OrphanReadingStub } from '../../../contracts/orphan-reading/orphan-reading.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

import { orphanReadBroker } from './orphan-read-broker';
import { orphanReadBrokerProxy } from './orphan-read-broker.proxy';

describe('orphanReadBroker', () => {
  it('VALID: {one live pgid, one dead} => two rows with alive true and false', async () => {
    const proxy = orphanReadBrokerProxy();
    const livePgid = ProcessGroupIdStub({ value: 200 });
    const deadPgid = ProcessGroupIdStub({ value: 999 });

    proxy.setupProcListing({ pids: ['100'] });
    proxy.setupPidStat({ pid: '100', pgrp: 200, comm: 'node' });
    proxy.setupCmdline({ pid: '100', argv: ['npm', 'run', 'dev:no-watch'] });
    proxy.setupAlive({ pgid: livePgid });
    // Nothing in the /proc listing carries pgrp 999 — the group has already been reaped.
    proxy.setupGone({ pgid: deadPgid });

    const result = await orphanReadBroker({ pgids: [livePgid, deadPgid] });

    expect(result).toStrictEqual([
      OrphanReadingStub({ pgid: livePgid, cmd: 'npm run dev:no-watch', alive: true }),
      OrphanReadingStub({ pgid: deadPgid, cmd: null, alive: false }),
    ]);
  });

  it('EDGE: {a pid exits before its stat can be read, ENOENT} => still resolves, cmd null for that pgid', async () => {
    const proxy = orphanReadBrokerProxy();
    const pgid = ProcessGroupIdStub({ value: 300 });

    proxy.setupProcListing({ pids: ['105'] });
    proxy.setupPidStatVanished({ pid: '105', code: 'ENOENT' });
    proxy.setupGone({ pgid });

    const result = await orphanReadBroker({ pgids: [pgid] });

    expect(result).toStrictEqual([OrphanReadingStub({ pgid, cmd: null, alive: false })]);
  });

  it('EDGE: {a pid exits between the stat open and the stat read, ESRCH} => still resolves, cmd null for that pgid', async () => {
    const proxy = orphanReadBrokerProxy();
    const pgid = ProcessGroupIdStub({ value: 300 });

    proxy.setupProcListing({ pids: ['106'] });
    proxy.setupPidStatVanished({ pid: '106', code: 'ESRCH' });
    proxy.setupGone({ pgid });

    const result = await orphanReadBroker({ pgids: [pgid] });

    expect(result).toStrictEqual([OrphanReadingStub({ pgid, cmd: null, alive: false })]);
  });

  it('EDGE: {a pid matches the pgid then exits before its cmdline can be read, ENOENT} => resolves, cmd null', async () => {
    const proxy = orphanReadBrokerProxy();
    const pgid = ProcessGroupIdStub({ value: 300 });

    proxy.setupProcListing({ pids: ['110'] });
    proxy.setupPidStat({ pid: '110', pgrp: 300, comm: 'node' });
    proxy.setupCmdlineVanished({ pid: '110', code: 'ENOENT' });
    proxy.setupAlive({ pgid });

    const result = await orphanReadBroker({ pgids: [pgid] });

    expect(result).toStrictEqual([OrphanReadingStub({ pgid, cmd: null, alive: true })]);
  });

  it('EDGE: {a pid matches the pgid then exits between the cmdline open and read, ESRCH} => resolves, cmd null', async () => {
    const proxy = orphanReadBrokerProxy();
    const pgid = ProcessGroupIdStub({ value: 300 });

    proxy.setupProcListing({ pids: ['111'] });
    proxy.setupPidStat({ pid: '111', pgrp: 300, comm: 'node' });
    proxy.setupCmdlineVanished({ pid: '111', code: 'ESRCH' });
    proxy.setupAlive({ pgid });

    const result = await orphanReadBroker({ pgids: [pgid] });

    expect(result).toStrictEqual([OrphanReadingStub({ pgid, cmd: null, alive: true })]);
  });

  it('ERROR: {stat read fails for a reason other than absence} => rejects rather than treating it as vanished', async () => {
    const proxy = orphanReadBrokerProxy();
    const pgid = ProcessGroupIdStub({ value: 300 });

    proxy.setupProcListing({ pids: ['107'] });
    proxy.setupPidStatFails({
      pid: '107',
      error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
    });
    proxy.setupGone({ pgid });

    await expect(orphanReadBroker({ pgids: [pgid] })).rejects.toThrow(
      'Failed to read file at /proc/107/stat',
    );
  });
});
