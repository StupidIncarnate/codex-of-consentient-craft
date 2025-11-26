import { typescriptTransformerStatics } from './typescript-transformer-statics';

describe('typescriptTransformerStatics', () => {
  describe('name', () => {
    it('VALID: => returns transformer name', () => {
      expect(typescriptTransformerStatics.name).toBe('jest-proxy-mock-transformer');
    });
  });

  describe('version', () => {
    it('VALID: => returns transformer version', () => {
      expect(typescriptTransformerStatics.version).toBe(1);
    });
  });
});
