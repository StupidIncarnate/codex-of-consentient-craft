import { AppNotFoundResponderProxy } from './app-not-found-responder.proxy';
import { AppNotFoundResponder } from './app-not-found-responder';
import { NotFoundPageWidget } from '../../../widgets/not-found-page/not-found-page-widget';

describe('AppNotFoundResponder', () => {
  describe('export', () => {
    it('VALID: => is the not-found page widget', () => {
      AppNotFoundResponderProxy();

      expect(AppNotFoundResponder).toBe(NotFoundPageWidget);
    });
  });
});
