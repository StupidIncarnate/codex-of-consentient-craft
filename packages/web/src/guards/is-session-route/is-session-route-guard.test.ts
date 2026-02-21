import { isSessionRouteGuard } from './is-session-route-guard';

describe('isSessionRouteGuard', () => {
  describe('valid session routes', () => {
    it('VALID: {guild-level session route} => returns true', () => {
      const result = isSessionRouteGuard({ pathname: '/my-guild/session' });

      expect(result).toBe(true);
    });

    it('VALID: {session with id} => returns true', () => {
      const result = isSessionRouteGuard({ pathname: '/my-guild/session/some-session-id' });

      expect(result).toBe(true);
    });
  });

  describe('backward compat quest routes', () => {
    it('VALID: {guild-level quest route} => returns true', () => {
      const result = isSessionRouteGuard({ pathname: '/my-guild/quest' });

      expect(result).toBe(true);
    });

    it('VALID: {quest with slug} => returns true', () => {
      const result = isSessionRouteGuard({ pathname: '/my-guild/quest/some-quest-id' });

      expect(result).toBe(true);
    });
  });

  describe('non-session routes', () => {
    it('INVALID: {home route} => returns false', () => {
      const result = isSessionRouteGuard({ pathname: '/' });

      expect(result).toBe(false);
    });

    it('INVALID: {only guild slug} => returns false', () => {
      const result = isSessionRouteGuard({ pathname: '/my-guild' });

      expect(result).toBe(false);
    });

    it('INVALID: {session not in second segment} => returns false', () => {
      const result = isSessionRouteGuard({ pathname: '/my-guild/settings' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {pathname undefined} => returns false', () => {
      const result = isSessionRouteGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {empty string} => returns false', () => {
      const result = isSessionRouteGuard({ pathname: '' });

      expect(result).toBe(false);
    });
  });
});
