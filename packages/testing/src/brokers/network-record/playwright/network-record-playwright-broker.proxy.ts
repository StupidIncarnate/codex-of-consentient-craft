import { playwrightPageEventsAdapterProxy } from '../../../adapters/playwright/page-events/playwright-page-events-adapter.proxy';
import { playwrightTestInfoAttachAdapterProxy } from '../../../adapters/playwright/test-info-attach/playwright-test-info-attach-adapter.proxy';

export const networkRecordPlaywrightBrokerProxy = (): Record<PropertyKey, never> => {
  playwrightPageEventsAdapterProxy();
  playwrightTestInfoAttachAdapterProxy();

  return {};
};
