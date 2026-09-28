import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBroker } from './dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from './dispatch-state-read-broker.proxy';

describe('dispatchStateReadBroker', () => {
  describe('valid state file', () => {
    it('VALID: {file: node-playing} => returns parsed state', async () => {
      const proxy = dispatchStateReadBrokerProxy();
      const state = DispatchStateStub({ mode: 'node-playing' });
      proxy.setupStateFile({ json: JSON.stringify(state) });

      const result = await dispatchStateReadBroker();

      expect(result).toStrictEqual(DispatchStateStub({ mode: 'node-playing' }));
    });

    it('VALID: {file: paused} => returns parsed state', async () => {
      const proxy = dispatchStateReadBrokerProxy();
      proxy.setupStateFile({ json: JSON.stringify(DispatchStateStub()) });

      const result = await dispatchStateReadBroker();

      expect(result).toStrictEqual(DispatchStateStub());
    });
  });

  describe('missing or corrupt state file', () => {
    it('EMPTY: {file missing} => returns paused default with epoch updatedAt', async () => {
      const proxy = dispatchStateReadBrokerProxy();
      proxy.setupMissingFile();

      const result = await dispatchStateReadBroker();

      expect(result).toStrictEqual(
        DispatchStateStub({ mode: 'paused', updatedAt: '1970-01-01T00:00:00.000Z' }),
      );
    });

    it('ERROR: {file corrupt} => returns paused default with epoch updatedAt', async () => {
      const proxy = dispatchStateReadBrokerProxy();
      proxy.setupCorruptFile();

      const result = await dispatchStateReadBroker();

      expect(result).toStrictEqual(
        DispatchStateStub({ mode: 'paused', updatedAt: '1970-01-01T00:00:00.000Z' }),
      );
    });

    it('ERROR: {file has wrong shape} => returns paused default with epoch updatedAt', async () => {
      const proxy = dispatchStateReadBrokerProxy();
      proxy.setupStateFile({ json: JSON.stringify({ mode: 'sprinting' }) });

      const result = await dispatchStateReadBroker();

      expect(result).toStrictEqual(
        DispatchStateStub({ mode: 'paused', updatedAt: '1970-01-01T00:00:00.000Z' }),
      );
    });
  });
});
