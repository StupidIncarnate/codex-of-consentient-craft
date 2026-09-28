import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { resetClearStorageLayerBroker } from './reset-clear-storage-layer-broker';
import { resetClearStorageLayerBrokerProxy } from './reset-clear-storage-layer-broker.proxy';

describe('resetClearStorageLayerBroker', () => {
  describe('a page with an origin', () => {
    it('VALID: {clearStorage resolves} => returns cleared: true', async () => {
      resetClearStorageLayerBrokerProxy();
      const clearStorageMock = jest.fn().mockResolvedValue(undefined);
      const browser = BrowserSessionStub({ clearStorage: clearStorageMock });

      const result = await resetClearStorageLayerBroker({ browser });

      expect(result).toStrictEqual({ cleared: true });
      expect(clearStorageMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('a fresh page with no origin (DEF-94)', () => {
    it('EMPTY: {clearStorage rejects with a localStorage SecurityError} => returns cleared: false rather than throwing', async () => {
      resetClearStorageLayerBrokerProxy();
      const clearStorageMock = jest
        .fn()
        .mockRejectedValue(
          new Error(
            "page.evaluate: SecurityError: Failed to read the 'localStorage' property from " +
              "'Window': Access is denied for this document.",
          ),
        );
      const browser = BrowserSessionStub({ clearStorage: clearStorageMock });

      const result = await resetClearStorageLayerBroker({ browser });

      expect(result).toStrictEqual({ cleared: false });
    });
  });

  describe('a genuine failure', () => {
    it('ERROR: {clearStorage rejects with an unrelated error} => rethrows it unchanged', async () => {
      resetClearStorageLayerBrokerProxy();
      const clearStorageMock = jest.fn().mockRejectedValue(new Error('boom'));
      const browser = BrowserSessionStub({ clearStorage: clearStorageMock });

      await expect(resetClearStorageLayerBroker({ browser })).rejects.toThrow(/^boom$/u);
    });
  });
});
