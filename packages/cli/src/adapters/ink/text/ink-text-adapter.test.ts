import { inkTextAdapter } from './ink-text-adapter';
import { inkTextAdapterProxy } from './ink-text-adapter.proxy';

describe('inkTextAdapter', () => {
  describe('component access', () => {
    it('VALID: {} => returns Text component', () => {
      inkTextAdapterProxy();

      const Text = inkTextAdapter();

      expect(Text).toBeDefined();
      // Text is a React forward ref (object), not a plain function
      expect(Boolean(Text)).toBe(true);
    });
  });
});
