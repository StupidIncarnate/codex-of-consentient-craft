import { FolderTypeStub } from '@dungeonmaster/shared/contracts';
import { folderPurposeTransformer } from './folder-purpose-transformer';

describe('folderPurposeTransformer', () => {
  describe('valid folder types', () => {
    it('VALID: {folderType: brokers} => returns business logic purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: FolderTypeStub({ value: 'brokers' }),
      });

      expect(purpose).toBe(
        'Business logic orchestration. Compose adapters, guards, transformers to implement domain operations.',
      );
    });

    it('VALID: {folderType: contracts} => returns type definition purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: FolderTypeStub({ value: 'contracts' }),
      });

      expect(purpose).toBe(
        'Type definitions and validation schemas using Zod. All data structures must be defined here with branded types.',
      );
    });

    it('VALID: {folderType: guards} => returns validation purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: FolderTypeStub({ value: 'guards' }),
      });

      expect(purpose).toBe(
        'Pure boolean functions that validate conditions. Return true/false, no side effects.',
      );
    });

    it('VALID: {folderType: transformers} => returns transformation purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: FolderTypeStub({ value: 'transformers' }),
      });

      expect(purpose).toBe(
        'Pure data transformation functions. Map input types to output types without side effects.',
      );
    });

    it('VALID: {folderType: adapters} => returns I/O boundary purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: FolderTypeStub({ value: 'adapters' }),
      });

      expect(purpose).toBe(
        'I/O boundary layer translating between external systems and internal contracts. Wrap npm packages, APIs, databases.',
      );
    });

    it('VALID: {folderType: widgets} => returns UI component purpose', () => {
      const purpose = folderPurposeTransformer({
        folderType: FolderTypeStub({ value: 'widgets' }),
      });

      expect(purpose).toBe('React UI components. Visual representation and user interaction.');
    });
  });
});
