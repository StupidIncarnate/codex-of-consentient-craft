import { isQuestRouteGuard } from './is-quest-route-guard';

describe('isQuestRouteGuard', () => {
  describe('valid quest routes', () => {
    it('VALID: {guild-level quest route} => returns true', () => {
      const result = isQuestRouteGuard({ pathname: '/my-guild/quest' });

      expect(result).toBe(true);
    });

    it('VALID: {quest with slug} => returns true', () => {
      const result = isQuestRouteGuard({ pathname: '/my-guild/quest/some-quest-id' });

      expect(result).toBe(true);
    });
  });

  describe('non-quest routes', () => {
    it('INVALID: {home route} => returns false', () => {
      const result = isQuestRouteGuard({ pathname: '/' });

      expect(result).toBe(false);
    });

    it('INVALID: {only guild slug} => returns false', () => {
      const result = isQuestRouteGuard({ pathname: '/my-guild' });

      expect(result).toBe(false);
    });

    it('INVALID: {quest not in second segment} => returns false', () => {
      const result = isQuestRouteGuard({ pathname: '/my-guild/settings' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {pathname undefined} => returns false', () => {
      const result = isQuestRouteGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {empty string} => returns false', () => {
      const result = isQuestRouteGuard({ pathname: '' });

      expect(result).toBe(false);
    });
  });
});
