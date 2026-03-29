import { playwrightPageEventsAdapter } from './playwright-page-events-adapter';
import { playwrightPageEventsAdapterProxy } from './playwright-page-events-adapter.proxy';

describe('playwrightPageEventsAdapter', () => {
  describe('export', () => {
    it('VALID: {adapter} => is a function', () => {
      playwrightPageEventsAdapterProxy();

      expect(playwrightPageEventsAdapter).toStrictEqual(expect.any(Function));
    });
  });
});
