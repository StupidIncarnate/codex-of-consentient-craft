import { matchPath } from 'react-router-dom';

import { AppHealthResponder } from '../../responders/app/health/app-health-responder';
import { HealthFlow } from './health-flow';

describe('HealthFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports HealthFlow function', () => {
      expect(HealthFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('route element', () => {
    it('VALID: {HealthFlow()} => returns a Route for /health mounting AppHealthResponder', () => {
      const route = HealthFlow();

      expect({
        path: route.props.path,
        elementType: route.props.element.type,
      }).toStrictEqual({
        path: '/health',
        elementType: AppHealthResponder,
      });
    });
  });

  describe('route matching', () => {
    it('VALID: {/health against /health pattern} => matches, mounting HEALTH_PAGE via AppHealthResponder', () => {
      const route = HealthFlow();
      const pattern = String(route.props.path);

      const match = matchPath(pattern, '/health');

      expect(match?.pathname).toBe('/health');
    });

    it('EDGE: {/queue against /health pattern} => does NOT match, so HEALTH_PAGE does not mount off-path', () => {
      const route = HealthFlow();
      const pattern = String(route.props.path);

      const match = matchPath(pattern, '/queue');

      expect(match).toBe(null);
    });
  });
});
