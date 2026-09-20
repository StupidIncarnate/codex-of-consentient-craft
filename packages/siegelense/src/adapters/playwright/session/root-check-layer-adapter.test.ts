import { rootCheckLayerAdapter } from './root-check-layer-adapter';
import { rootCheckLayerAdapterProxy } from './root-check-layer-adapter.proxy';

describe('rootCheckLayerAdapter', () => {
  describe('checkSource()', () => {
    it('VALID: generates script that queries selector from healthStatics', () => {
      rootCheckLayerAdapterProxy();
      const adapter = rootCheckLayerAdapter();

      const source = adapter.checkSource();

      expect(source).toBe('Boolean(document.querySelector("#root"))');
    });
  });

  describe('toResult()', () => {
    it('VALID: {raw: true} => returns true', () => {
      rootCheckLayerAdapterProxy();
      const adapter = rootCheckLayerAdapter();

      expect(adapter.toResult({ raw: true })).toBe(true);
    });

    it('VALID: {raw: false} => returns false', () => {
      rootCheckLayerAdapterProxy();
      const adapter = rootCheckLayerAdapter();

      expect(adapter.toResult({ raw: false })).toBe(false);
    });

    it('VALID: {raw: null} => returns false', () => {
      rootCheckLayerAdapterProxy();
      const adapter = rootCheckLayerAdapter();

      expect(adapter.toResult({ raw: null })).toBe(false);
    });

    it('VALID: {raw: undefined} => returns false', () => {
      rootCheckLayerAdapterProxy();
      const adapter = rootCheckLayerAdapter();

      expect(adapter.toResult({ raw: undefined })).toBe(false);
    });
  });
});
