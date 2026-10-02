import { machineRssByTreeBroker } from './machine-rss-by-tree-broker';
import { machineRssByTreeBrokerProxy } from './machine-rss-by-tree-broker.proxy';

describe('machineRssByTreeBroker', () => {
  it('VALID: {single root process with no children} => returns its own resident memory', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100'] });
    proxy.setupPidStat({ pid: '100', ppid: 1, comm: 'node' });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    // 2560 pages * 4096 bytes/page / 1_048_576 bytes/MB = 10 MB
    expect(result).toBe(10);
  });

  it('VALID: {root process with multiple children and grandchildren} => returns summed resident memory of entire tree', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101', '102', '103'] });
    // Root process
    proxy.setupPidStat({ pid: '100', ppid: 1, comm: 'parent' });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 }); // 10 MB
    // First child
    proxy.setupPidStat({ pid: '101', ppid: 100, comm: 'child1' });
    proxy.setupPidStatm({ pid: '101', residentPages: 1280 }); // 5 MB
    // Grandchild under child1
    proxy.setupPidStat({ pid: '102', ppid: 101, comm: 'grandchild' });
    proxy.setupPidStatm({ pid: '102', residentPages: 1280 }); // 5 MB
    // Second child under root
    proxy.setupPidStat({ pid: '103', ppid: 100, comm: 'child2' });
    proxy.setupPidStatm({ pid: '103', residentPages: 2560 }); // 10 MB

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    // (2560 + 1280 + 1280 + 2560) = 7680 pages * 4096 / 1_048_576 = 30 MB
    expect(result).toBe(30);
  });

  it('VALID: {unrelated processes in /proc} => excludes unrelated processes from the sum', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101', '200'] });
    proxy.setupPidStat({ pid: '100', ppid: 1, comm: 'target-root' });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 }); // 10 MB
    proxy.setupPidStat({ pid: '101', ppid: 100, comm: 'target-child' });
    proxy.setupPidStatm({ pid: '101', residentPages: 1280 }); // 5 MB
    // Unrelated process (ppid 1, not in tree) — statm never read
    proxy.setupPidStat({ pid: '200', ppid: 1, comm: 'other-daemon' });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(15);
  });

  it('VALID: {process comm contains closing parentheses and spaces} => parses ppid correctly', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101'] });
    proxy.setupPidStat({ pid: '100', ppid: 1, comm: 'code --wait ) ( helper' });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });
    proxy.setupPidStat({ pid: '101', ppid: 100, comm: 'worker (sub) process' });
    proxy.setupPidStatm({ pid: '101', residentPages: 2560 });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(20);
  });

  it('EMPTY: {/proc directory is absent} => returns null', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcMissing();

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(null);
  });

  it('EDGE: {root pid is not in /proc} => returns 0', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['200', '201'] });
    proxy.setupPidStat({ pid: '200', ppid: 1 });
    proxy.setupPidStat({ pid: '201', ppid: 200 });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(0);
  });

  it('EDGE: {pid vanishes during stat read with ENOENT} => skips vanished process without throwing', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101'] });
    proxy.setupPidStat({ pid: '100', ppid: 1 });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });
    proxy.setupPidStatVanished({ pid: '101', code: 'ENOENT' });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(10);
  });

  it('EDGE: {pid vanishes during stat read with ESRCH} => skips vanished process without throwing', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101'] });
    proxy.setupPidStat({ pid: '100', ppid: 1 });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });
    proxy.setupPidStatVanished({ pid: '101', code: 'ESRCH' });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(10);
  });

  it('EDGE: {child pid vanishes during statm read with ENOENT} => contributes 0 pages without throwing', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101'] });
    proxy.setupPidStat({ pid: '100', ppid: 1 });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });
    proxy.setupPidStat({ pid: '101', ppid: 100 });
    proxy.setupPidStatmVanished({ pid: '101', code: 'ENOENT' });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(10);
  });

  it('EDGE: {child pid vanishes during statm read with ESRCH} => contributes 0 pages without throwing', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100', '101'] });
    proxy.setupPidStat({ pid: '100', ppid: 1 });
    proxy.setupPidStatm({ pid: '100', residentPages: 2560 });
    proxy.setupPidStat({ pid: '101', ppid: 100 });
    proxy.setupPidStatmVanished({ pid: '101', code: 'ESRCH' });

    const result = await machineRssByTreeBroker({ rootPid: 100 });

    expect(result).toBe(10);
  });

  it('ERROR: {stat read encounters unexpected error} => propagates error', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100'] });
    const permissionError = new Error('EACCES: permission denied');
    proxy.setupPidStatFails({ pid: '100', error: permissionError });

    await expect(machineRssByTreeBroker({ rootPid: 100 })).rejects.toThrow('EACCES');
  });

  it('ERROR: {statm read encounters unexpected error} => propagates error', async () => {
    const proxy = machineRssByTreeBrokerProxy();
    proxy.setupProcListing({ pids: ['100'] });
    proxy.setupPidStat({ pid: '100', ppid: 1 });
    const permissionError = new Error('EACCES: permission denied');
    proxy.setupPidStatmFails({ pid: '100', error: permissionError });

    await expect(machineRssByTreeBroker({ rootPid: 100 })).rejects.toThrow('EACCES');
  });
});
