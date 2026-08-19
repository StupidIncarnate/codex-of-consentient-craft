import { HealthPageWidget } from '../../../widgets/health-page/health-page-widget';
import { AppHealthResponderProxy } from './app-health-responder.proxy';
import { AppHealthResponder } from './app-health-responder';

describe('AppHealthResponder', () => {
  describe('export', () => {
    it('VALID: => is HealthPageWidget, so the /health route element renders HEALTH_PAGE', () => {
      AppHealthResponderProxy();

      expect(AppHealthResponder).toBe(HealthPageWidget);
    });
  });
});
