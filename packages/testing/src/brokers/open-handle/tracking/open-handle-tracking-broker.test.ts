import { openHandleTrackingBroker } from './open-handle-tracking-broker';
import { openHandleTrackingBrokerProxy } from './open-handle-tracking-broker.proxy';

describe('openHandleTrackingBroker', () => {
  describe('watch', () => {
    it('VALID: {called} => returns success', () => {
      openHandleTrackingBrokerProxy();
      openHandleTrackingBroker.clear();

      const result = openHandleTrackingBroker.watch();

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('pending', () => {
    it('VALID: {un-cleared interval} => reports it once, as setInterval', () => {
      openHandleTrackingBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const kinds = openHandleTrackingBroker.pending().map((armed) => armed.kind);
      clearInterval(interval);
      openHandleTrackingBroker.clear();

      expect(kinds).toStrictEqual(['setInterval']);
    });

    it('VALID: {interval cleared before the check} => reports nothing', () => {
      openHandleTrackingBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      clearInterval(setInterval(() => undefined, 60_000));
      const kinds = openHandleTrackingBroker.pending().map((armed) => armed.kind);
      openHandleTrackingBroker.clear();

      expect(kinds).toStrictEqual([]);
    });

    it('VALID: {two un-cleared timers} => reports both, in arm order', () => {
      openHandleTrackingBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const timeout = setTimeout(() => undefined, 60_000);
      const kinds = openHandleTrackingBroker.pending().map((armed) => armed.kind);
      clearInterval(interval);
      clearTimeout(timeout);
      openHandleTrackingBroker.clear();

      expect(kinds).toStrictEqual(['setInterval', 'setTimeout']);
    });

    it('VALID: {unref-ed interval} => reports nothing, because it holds nothing open', () => {
      openHandleTrackingBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      interval.unref();
      const kinds = openHandleTrackingBroker.pending().map((armed) => armed.kind);
      clearInterval(interval);
      openHandleTrackingBroker.clear();

      expect(kinds).toStrictEqual([]);
    });
  });

  describe('clear', () => {
    it('VALID: {cleared after an interval was armed} => pending is empty again', () => {
      openHandleTrackingBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      openHandleTrackingBroker.clear();
      const kinds = openHandleTrackingBroker.pending().map((armed) => armed.kind);
      clearInterval(interval);

      expect(kinds).toStrictEqual([]);
    });
  });
});
