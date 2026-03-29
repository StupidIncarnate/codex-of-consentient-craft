import { processKillByPortAdapter } from './process-kill-by-port-adapter';
import { processKillByPortAdapterProxy } from './process-kill-by-port-adapter.proxy';

describe('processKillByPortAdapter', () => {
  describe('port with processes', () => {
    it('VALID: {port with one pid} => kills the pid and returns it', () => {
      const proxy = processKillByPortAdapterProxy();
      proxy.portHasPids({ pids: [12345] });

      const result = processKillByPortAdapter({ port: 3000 });

      expect(result).toStrictEqual({ killedPids: [12345] });
    });

    it('VALID: {port with multiple pids} => kills all pids and returns them', () => {
      const proxy = processKillByPortAdapterProxy();
      proxy.portHasPids({ pids: [12345, 67890] });

      const result = processKillByPortAdapter({ port: 3000 });

      expect(result).toStrictEqual({ killedPids: [12345, 67890] });
    });
  });

  describe('port with no processes', () => {
    it('VALID: {port is empty} => returns empty killedPids', () => {
      const proxy = processKillByPortAdapterProxy();
      proxy.portIsEmpty();

      const result = processKillByPortAdapter({ port: 3000 });

      expect(result).toStrictEqual({ killedPids: [] });
    });
  });

  describe('error handling', () => {
    it('ERROR: {lsof fails, port not in use} => returns empty killedPids silently', () => {
      const proxy = processKillByPortAdapterProxy();
      proxy.lsofThrows({ error: new Error('lsof: no results') });

      const result = processKillByPortAdapter({ port: 3000 });

      expect(result).toStrictEqual({ killedPids: [] });
    });
  });
});
