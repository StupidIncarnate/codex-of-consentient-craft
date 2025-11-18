import { filePathWithTypeInfixTransformer } from './file-path-with-type-infix-transformer';
import { FilePathStub } from '@questmaestro/shared/contracts';

describe('filePathWithTypeInfixTransformer', () => {
  describe('valid paths with .ts extension', () => {
    it('VALID: {filePath: user-contract.ts} => returns user-contract.type.ts', () => {
      const filePath = FilePathStub({ value: '/src/contracts/user/user-contract.ts' });

      const result = filePathWithTypeInfixTransformer({ filePath });

      expect(result).toBe('/src/contracts/user/user-contract.type.ts');
    });

    it('VALID: {filePath: broker.ts} => returns broker.type.ts', () => {
      const filePath = FilePathStub({ value: '/src/brokers/user/user-broker.ts' });

      const result = filePathWithTypeInfixTransformer({ filePath });

      expect(result).toBe('/src/brokers/user/user-broker.type.ts');
    });
  });

  describe('valid paths with .tsx extension', () => {
    it('VALID: {filePath: button-widget.tsx} => returns button-widget.type.tsx', () => {
      const filePath = FilePathStub({ value: '/src/widgets/button/button-widget.tsx' });

      const result = filePathWithTypeInfixTransformer({ filePath });

      expect(result).toBe('/src/widgets/button/button-widget.type.tsx');
    });

    it('VALID: {filePath: component.tsx} => returns component.type.tsx', () => {
      const filePath = FilePathStub({ value: '/src/widgets/avatar/avatar-widget.tsx' });

      const result = filePathWithTypeInfixTransformer({ filePath });

      expect(result).toBe('/src/widgets/avatar/avatar-widget.type.tsx');
    });
  });

  describe('edge cases', () => {
    it('VALID: {filePath with multiple dots} => inserts type before extension only', () => {
      const filePath = FilePathStub({ value: '/src/contracts/user.v2/user-contract.ts' });

      const result = filePathWithTypeInfixTransformer({ filePath });

      expect(result).toBe('/src/contracts/user.v2/user-contract.type.ts');
    });

    it('VALID: {deeply nested path} => preserves full path with type infix', () => {
      const filePath = FilePathStub({ value: '/src/brokers/user/fetch/deep/user-fetch-broker.ts' });

      const result = filePathWithTypeInfixTransformer({ filePath });

      expect(result).toBe('/src/brokers/user/fetch/deep/user-fetch-broker.type.ts');
    });
  });
});
