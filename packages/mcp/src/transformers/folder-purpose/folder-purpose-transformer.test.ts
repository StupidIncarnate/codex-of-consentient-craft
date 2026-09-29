import { folderPurposeTransformer } from './folder-purpose-transformer';

describe('folderPurposeTransformer', () => {
  describe('valid folder types', () => {
    it('VALID: {folderType: brokers} => returns business logic purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: 'brokers',
      });

      expect(purpose).toBe(
        'Business logic orchestration. Compose adapters, guards, transformers to implement domain operations.',
      );
    });

    it('VALID: {folderType: contracts} => returns type definition purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: 'contracts',
      });

      expect(purpose).toBe(
        'Type definitions and validation schemas using Zod. All data structures must be defined here with branded types.',
      );
    });

    it('VALID: {folderType: guards} => returns validation purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: 'guards',
      });

      expect(purpose).toBe(
        'Pure boolean functions that validate conditions. Return true/false, no side effects.',
      );
    });

    it('VALID: {folderType: transformers} => returns transformation purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: 'transformers',
      });

      expect(purpose).toBe(
        'Pure data transformation functions. Map input types to output types without side effects.',
      );
    });

    it('VALID: {folderType: widgets} => returns UI component purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: 'widgets',
      });

      expect(purpose).toBe('React UI components. Visual representation and user interaction.');
    });
  });
});
