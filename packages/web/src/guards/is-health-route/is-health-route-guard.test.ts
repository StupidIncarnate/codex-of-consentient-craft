import { isHealthRouteGuard } from './is-health-route-guard';

describe('isHealthRouteGuard', () => {
  describe('health routes', () => {
    it('VALID: {pathname: /health} => returns true', () => {
      const result = isHealthRouteGuard({ pathname: '/health' });

      expect(result).toBe(true);
    });

    it('VALID: {pathname: /health/} => returns true', () => {
      const result = isHealthRouteGuard({ pathname: '/health/' });

      expect(result).toBe(true);
    });
  });

  describe('non-health routes', () => {
    it('INVALID: {pathname: /} => returns false', () => {
      const result = isHealthRouteGuard({ pathname: '/' });

      expect(result).toBe(false);
    });

    it('INVALID: {pathname: /queue} => returns false', () => {
      const result = isHealthRouteGuard({ pathname: '/queue' });

      expect(result).toBe(false);
    });

    it('INVALID: {pathname: /health/extra} => returns false', () => {
      const result = isHealthRouteGuard({ pathname: '/health/extra' });

      expect(result).toBe(false);
    });

    it('INVALID: {pathname: /my-guild/health} => returns false', () => {
      const result = isHealthRouteGuard({ pathname: '/my-guild/health' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {pathname: empty string} => returns false', () => {
      const result = isHealthRouteGuard({ pathname: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: {pathname omitted} => returns false', () => {
      const result = isHealthRouteGuard({});

      expect(result).toBe(false);
    });
  });
});
