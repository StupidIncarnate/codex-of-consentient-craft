/**
 * PURPOSE: Proxy for open-handle-tracking-broker testing
 *
 * USAGE:
 * openHandleTrackingBrokerProxy();
 * // The broker composes the timers watch broker, which wraps language primitives and so runs
 * // REAL — mocking it would leave the test asserting against the mock rather than node's handles
 */

import { timersWatchBrokerProxy } from '../../timers/watch/timers-watch-broker.proxy';

export const openHandleTrackingBrokerProxy = (): Record<PropertyKey, never> => {
  timersWatchBrokerProxy();

  return {};
};
