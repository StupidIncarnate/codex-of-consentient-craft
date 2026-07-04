import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchStateWriteBroker } from './dispatch-state-write-broker';
import { dispatchStateWriteBrokerProxy } from './dispatch-state-write-broker.proxy';

describe('dispatchStateWriteBroker', () => {
  describe('successful writes', () => {
    it('VALID: {mode: node-playing} => returns stamped state and writes tmp then renames', async () => {
      const proxy = dispatchStateWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await dispatchStateWriteBroker({ mode: 'node-playing' });

      expect(result).toStrictEqual(
        DispatchStateStub({ mode: 'node-playing', updatedAt: '2024-01-15T10:00:00.000Z' }),
      );
      expect(proxy.getWrittenPath()).toBe('/home/user/.dungeonmaster/dispatch-state.json.tmp');
      expect(proxy.getWrittenContent()).toBe(
        `${JSON.stringify({ mode: 'node-playing', updatedAt: '2024-01-15T10:00:00.000Z' })}\n`,
      );
      expect(proxy.getRenamedTo()).toBe('/home/user/.dungeonmaster/dispatch-state.json');
    });

    it('VALID: {mode: paused, mcpHeartbeatAt} => persists heartbeat alongside mode', async () => {
      const proxy = dispatchStateWriteBrokerProxy();
      proxy.setupWriteSuccess();
      const { mcpHeartbeatAt } = DispatchStateStub({
        mcpHeartbeatAt: '2024-01-15T09:59:00.000Z',
      });

      const result = await dispatchStateWriteBroker({ mode: 'paused', mcpHeartbeatAt });

      expect(result).toStrictEqual(
        DispatchStateStub({
          mode: 'paused',
          mcpHeartbeatAt: '2024-01-15T09:59:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
        }),
      );
    });
  });

  describe('write failures', () => {
    it('ERROR: {tmp write fails} => rejects with the write error', async () => {
      const proxy = dispatchStateWriteBrokerProxy();
      proxy.setupWriteFailure({ error: new Error('disk full') });

      await expect(dispatchStateWriteBroker({ mode: 'paused' })).rejects.toThrow(/^disk full$/u);
    });
  });
});
