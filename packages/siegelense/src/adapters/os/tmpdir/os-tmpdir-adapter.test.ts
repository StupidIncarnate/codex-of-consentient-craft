import { osTmpdirAdapter } from './os-tmpdir-adapter';
import { osTmpdirAdapterProxy } from './os-tmpdir-adapter.proxy';

describe('osTmpdirAdapter', () => {
  describe('the path it answers with', () => {
    it('VALID: {os reports /tmp} => returns /tmp', () => {
      const proxy = osTmpdirAdapterProxy();
      proxy.returns({ path: '/tmp' });

      const result = osTmpdirAdapter();

      expect(result).toBe('/tmp');
    });

    it('VALID: {os reports a per-user scratch dir} => returns that path', () => {
      const proxy = osTmpdirAdapterProxy();
      proxy.returns({ path: '/var/folders/9k/T' });

      const result = osTmpdirAdapter();

      expect(result).toBe('/var/folders/9k/T');
    });
  });

  describe('what it rejects', () => {
    it('INVALID: {os reports a relative path} => throws', () => {
      const proxy = osTmpdirAdapterProxy();
      proxy.returns({ path: 'tmp' });

      expect(() => osTmpdirAdapter()).toThrow(/absolute/u);
    });
  });
});
