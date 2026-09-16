import { machineOomCountBroker } from './machine-oom-count-broker';
import { machineOomCountBrokerProxy } from './machine-oom-count-broker.proxy';

describe('machineOomCountBroker', () => {
  it("VALID: {vmstat containing 'oom_kill 2'} => returns 2", async () => {
    const proxy = machineOomCountBrokerProxy();
    proxy.setupVmstat({
      content: 'nr_free_pages 106232\noom_kill 2\nnr_zone_inactive_anon 0\n',
    });

    const result = await machineOomCountBroker();

    expect(result).toBe(2);
  });

  it('EMPTY: {vmstat without the key} => returns null', async () => {
    const proxy = machineOomCountBrokerProxy();
    proxy.setupVmstat({ content: 'nr_free_pages 106232\nnr_zone_inactive_anon 0\n' });

    const result = await machineOomCountBroker();

    expect(result).toBe(null);
  });

  it('EMPTY: {file absent} => returns null', async () => {
    const proxy = machineOomCountBrokerProxy();
    proxy.setupVmstatMissing();

    const result = await machineOomCountBroker();

    expect(result).toBe(null);
  });

  it('ERROR: {read fails for a reason other than absence} => rejects rather than reporting unavailable', async () => {
    const proxy = machineOomCountBrokerProxy();
    proxy.setupVmstatReadFails({
      error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
    });

    await expect(machineOomCountBroker()).rejects.toThrow('Failed to read file at /proc/vmstat');
  });
});
