import { networkRecordPlaywrightBroker } from './network-record-playwright-broker';
import { networkRecordPlaywrightBrokerProxy } from './network-record-playwright-broker.proxy';

describe('networkRecordPlaywrightBroker', () => {
  describe('initialization', () => {
    it('VALID: {page} => returns recorder with dump, getEntries, getWsEntries', () => {
      networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: { on: () => undefined } as never,
      });

      expect(typeof recorder.dump).toBe('function');
      expect(typeof recorder.getEntries).toBe('function');
      expect(typeof recorder.getWsEntries).toBe('function');
    });

    it('VALID: {page} => getEntries returns empty array initially', () => {
      networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: { on: () => undefined } as never,
      });

      expect(recorder.getEntries()).toStrictEqual([]);
    });

    it('VALID: {page} => getWsEntries returns empty array initially', () => {
      networkRecordPlaywrightBrokerProxy();

      const recorder = networkRecordPlaywrightBroker({
        page: { on: () => undefined } as never,
      });

      expect(recorder.getWsEntries()).toStrictEqual([]);
    });
  });
});
