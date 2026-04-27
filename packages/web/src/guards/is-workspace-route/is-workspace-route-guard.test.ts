import { isWorkspaceRouteGuard } from './is-workspace-route-guard';

describe('isWorkspaceRouteGuard', () => {
  describe('quest routes', () => {
    it('VALID: {bare quest route} => returns true', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/my-guild/quest' });

      expect(result).toBe(true);
    });

    it('VALID: {quest with id} => returns true', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/my-guild/quest/q-123' });

      expect(result).toBe(true);
    });
  });

  describe('session routes', () => {
    it('VALID: {bare session route} => returns true', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/my-guild/session' });

      expect(result).toBe(true);
    });

    it('VALID: {session with id} => returns true', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/my-guild/session/sess-1' });

      expect(result).toBe(true);
    });
  });

  describe('non-workspace routes', () => {
    it('INVALID: {home route} => returns false', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/' });

      expect(result).toBe(false);
    });

    it('INVALID: {only guild slug} => returns false', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/my-guild' });

      expect(result).toBe(false);
    });

    it('INVALID: {settings second segment} => returns false', () => {
      const result = isWorkspaceRouteGuard({ pathname: '/my-guild/settings' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {pathname undefined} => returns false', () => {
      const result = isWorkspaceRouteGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {empty string} => returns false', () => {
      const result = isWorkspaceRouteGuard({ pathname: '' });

      expect(result).toBe(false);
    });
  });
});
