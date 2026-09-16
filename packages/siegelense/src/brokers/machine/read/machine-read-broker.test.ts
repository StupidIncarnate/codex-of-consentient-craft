import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { machineReadBroker } from './machine-read-broker';
import { machineReadBrokerProxy } from './machine-read-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

describe('machineReadBroker', () => {
  it('VALID: {os, disk and oom readings all available} => returns the complete machine reading', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupMachineReading({
      homeDir: HOME_DIR,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      diskBavail: 512_000,
      diskBsize: 4096,
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
    });

    const result = await machineReadBroker();

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: 2,
      lastOomAt: null,
    });
  });

  it('EMPTY: {oom count unavailable} => returns oomKillsSinceBoot null without losing the rest', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupOomUnavailable({
      homeDir: HOME_DIR,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      diskBavail: 512_000,
      diskBsize: 4096,
    });

    const result = await machineReadBroker();

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: null,
      lastOomAt: null,
    });
  });

  it('VALID: {siegelense directory not yet created on this machine} => still returns a real freeDiskMB reading', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupSiegelenseDirNotYetCreated({
      homeDir: HOME_DIR,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      diskBavail: 512_000,
      diskBsize: 4096,
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
    });

    const result = await machineReadBroker();

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: 2,
      lastOomAt: null,
    });
  });

  it('ERROR: {home directory statfs rejects with EACCES} => propagates the permission error rather than reporting a clean machine', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupHomeStatfsPermissionDenied({
      homeDir: HOME_DIR,
      homePath: HOME_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
    });

    await expect(machineReadBroker()).rejects.toThrow(/EACCES/u);
  });
});
