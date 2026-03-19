import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { netKillPortAdapter } from './net-kill-port-adapter';
import { netKillPortAdapterProxy } from './net-kill-port-adapter.proxy';

describe('netKillPortAdapter', () => {
  describe('processes found on port', () => {
    it('VALID: {port with two PIDs} => calls lsof then kill with discovered PIDs', async () => {
      const proxy = netKillPortAdapterProxy();
      proxy.setupPids({ pids: ['12345', '67890'] });
      const port = NetworkPortStub({ value: 49555 });

      await netKillPortAdapter({ port });

      const execCalls = proxy.getExecCalls();

      expect(execCalls).toStrictEqual([
        { command: 'lsof -ti :49555' },
        { command: 'kill 12345 67890' },
      ]);
    });
  });

  describe('no processes found', () => {
    it('EMPTY: {port with no listeners} => calls lsof only, no kill', async () => {
      const proxy = netKillPortAdapterProxy();
      proxy.setupNoPids();
      const port = NetworkPortStub({ value: 49555 });

      await netKillPortAdapter({ port });

      const execCalls = proxy.getExecCalls();

      expect(execCalls).toStrictEqual([{ command: 'lsof -ti :49555' }]);
    });
  });
});
