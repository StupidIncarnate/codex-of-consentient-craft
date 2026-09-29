import { NotFoundFlow } from './not-found-flow';

describe('NotFoundFlow', () => {
  describe('catch-all route', () => {
    it('VALID: {} => returns a Route matching every path via the * splat', () => {
      const route = NotFoundFlow();

      expect(route.props.path).toBe('*');
    });
  });
});
