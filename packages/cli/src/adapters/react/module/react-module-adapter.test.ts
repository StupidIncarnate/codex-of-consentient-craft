import { reactModuleAdapter } from './react-module-adapter';
import { reactModuleAdapterProxy } from './react-module-adapter.proxy';

describe('reactModuleAdapter', () => {
  describe('module access', () => {
    it('VALID: {} => returns React module', () => {
      reactModuleAdapterProxy();

      const React = reactModuleAdapter();

      expect(React).toBeDefined();
      expect(React.createElement).toBeDefined();
      expect(typeof React.createElement).toBe('function');
    });
  });
});
