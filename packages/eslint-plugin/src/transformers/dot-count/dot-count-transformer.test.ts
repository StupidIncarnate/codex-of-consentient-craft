import { dotCountTransformer } from './dot-count-transformer';

describe('dotCountTransformer', () => {
  describe('counting dots', () => {
    it('VALID: {str: "file.test.ts"} => returns 2', () => {
      const result = dotCountTransformer({ str: 'file.test.ts' });

      expect(result).toBe(2);
    });

    it('VALID: {str: "file.ts"} => returns 1', () => {
      const result = dotCountTransformer({ str: 'file.ts' });

      expect(result).toBe(1);
    });

    it('VALID: {str: "file.stub.ts"} => returns 2', () => {
      const result = dotCountTransformer({ str: 'file.stub.ts' });

      expect(result).toBe(2);
    });

    it('VALID: {str: "file.proxy.tsx"} => returns 2', () => {
      const result = dotCountTransformer({ str: 'file.proxy.tsx' });

      expect(result).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('VALID: {str: "file"} => returns 0', () => {
      const result = dotCountTransformer({ str: 'file' });

      expect(result).toBe(0);
    });

    it('EMPTY: {str: ""} => returns 0', () => {
      const result = dotCountTransformer({ str: '' });

      expect(result).toBe(0);
    });

    it('VALID: {str: "..."} => returns 3', () => {
      const result = dotCountTransformer({ str: '...' });

      expect(result).toBe(3);
    });
  });
});
