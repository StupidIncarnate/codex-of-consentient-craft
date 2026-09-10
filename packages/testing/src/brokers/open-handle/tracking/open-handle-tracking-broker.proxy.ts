/**
 * PURPOSE: Proxy for open-handle-tracking-broker testing
 *
 * USAGE:
 * openHandleTrackingBrokerProxy();
 * // The broker composes the timers watch adapter, which wraps language primitives and so runs
 * // REAL — mocking it would leave the test asserting against the mock rather than node's handles
 */

import { timersWatchAdapterProxy } from '../../../adapters/timers/watch/timers-watch-adapter.proxy';

export const openHandleTrackingBrokerProxy = (): Record<PropertyKey, never> => {
  timersWatchAdapterProxy();

  return {};
};
