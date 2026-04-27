import { SessionViewWidget } from '../../../widgets/session-view/session-view-widget';
import { AppSessionViewResponderProxy } from './app-session-view-responder.proxy';
import { AppSessionViewResponder } from './app-session-view-responder';

describe('AppSessionViewResponder', () => {
  describe('export', () => {
    it('VALID: => is a function', () => {
      AppSessionViewResponderProxy();

      expect(AppSessionViewResponder).toStrictEqual(expect.any(Function));
    });

    it('VALID: => is the same reference as SessionViewWidget (thin re-export, not a wrapper)', () => {
      AppSessionViewResponderProxy();

      expect(AppSessionViewResponder).toBe(SessionViewWidget);
    });
  });
});
