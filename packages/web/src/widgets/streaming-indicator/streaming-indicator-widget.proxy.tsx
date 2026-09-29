import { clearIntervalProxy } from '#gateway/browser/clearInterval/clear-interval/clear-interval.proxy';
import { clearTimeoutProxy } from '#gateway/browser/clearTimeout/clear-timeout/clear-timeout.proxy';
import { setIntervalProxy } from '#gateway/browser/setInterval/set-interval/set-interval.proxy';
import { setTimeoutProxy } from '#gateway/browser/setTimeout/set-timeout/set-timeout.proxy';

export const StreamingIndicatorWidgetProxy = (): Record<PropertyKey, never> => {
  // Every timer proxy passes through: the indicator's real interval and timeout run and are cleared.
  setIntervalProxy();
  clearIntervalProxy();
  setTimeoutProxy();
  clearTimeoutProxy();
  return {};
};
