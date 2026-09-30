
import { portKillListenersBroker } from './port-kill-listeners-broker';
import { portKillListenersBrokerProxy } from './port-kill-listeners-broker.proxy';

describe('portKillListenersBroker', () => {
  describe('processes found on the port', () => {
    it('VALID: {port with two pids listening} => kills each pid and returns its own result', async () => {
      const proxy = portKillListenersBrokerProxy();
      const port = 49555;
      proxy.setupListeners({ port, pids: [12345, 67890] });
      proxy.setupKillResult({ pid: 12345, exitCode: 0, output: '' });
      proxy.setupKillResult({
        pid: 67890,
        exitCode: 1,
        output: 'kill: (67890): No such process',
      });

      const result = await portKillListenersBroker({ port });

      expect(result).toStrictEqual([
        { pid: 12345, exitCode: 0, output: '' },
        { pid: 67890, exitCode: 1, output: 'kill: (67890): No such process' },
      ]);
      expect(proxy.getKillCallsFor({ pid: 12345 })).toStrictEqual([
        [{ command: 'kill', args: ['-SIGKILL', '12345'], cwd: '/' }],
      ]);
      expect(proxy.getKillCallsFor({ pid: 67890 })).toStrictEqual([
        [{ command: 'kill', args: ['-SIGKILL', '67890'], cwd: '/' }],
      ]);
    });
  });

  describe('no processes on the port', () => {
    it('EMPTY: {port with no listeners} => returns an empty array', async () => {
      const proxy = portKillListenersBrokerProxy();
      const port = 49555;
      proxy.setupNoneListening({ port });

      const result = await portKillListenersBroker({ port });

      expect(result).toStrictEqual([]);
      expect(proxy.getKillCallsFor({ pid: 12345 })).toStrictEqual([]);
    });
  });
});
