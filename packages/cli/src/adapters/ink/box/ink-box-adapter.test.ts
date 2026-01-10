import { inkBoxAdapter } from './ink-box-adapter';
import { inkBoxAdapterProxy } from './ink-box-adapter.proxy';

describe('inkBoxAdapter', () => {
  describe('component access', () => {
    it('VALID: {} => returns Box component', () => {
      inkBoxAdapterProxy();

      const Box = inkBoxAdapter();

      expect(Box).toBeDefined();
      // Box is a React forward ref (object), not a plain function
      expect(Boolean(Box)).toBe(true);
    });
  });
});
