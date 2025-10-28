import { hasMetadataCommentGuard } from './has-metadata-comment-guard';
import { hasMetadataCommentGuardProxy } from './has-metadata-comment-guard.proxy';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('hasMetadataCommentGuard', () => {
  describe('valid metadata', () => {
    it('VALID: {fileContents: with all sections} => returns true', () => {
      const guardProxy = hasMetadataCommentGuardProxy();
      const fileContents = guardProxy.setupValidMetadata();

      const result = hasMetadataCommentGuard({ fileContents });

      expect(result).toBe(true);
    });
  });

  describe('invalid metadata', () => {
    it('INVALID: {fileContents: missing PURPOSE} => returns false', () => {
      const guardProxy = hasMetadataCommentGuardProxy();
      const fileContents = guardProxy.setupMissingPurpose();

      const result = hasMetadataCommentGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('INVALID: {fileContents: missing USAGE} => returns false', () => {
      const guardProxy = hasMetadataCommentGuardProxy();
      const fileContents = guardProxy.setupMissingUsage();

      const result = hasMetadataCommentGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('INVALID: {fileContents: missing RELATED} => returns false', () => {
      const guardProxy = hasMetadataCommentGuardProxy();
      const fileContents = guardProxy.setupMissingRelated();

      const result = hasMetadataCommentGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('INVALID: {fileContents: empty string} => returns false', () => {
      const fileContents = FileContentsStub({ value: '' });

      const result = hasMetadataCommentGuard({ fileContents });

      expect(result).toBe(false);
    });

    it('INVALID: {fileContents: plain code without metadata} => returns false', () => {
      const fileContents = FileContentsStub({
        value: 'export const testFunction = () => {};',
      });

      const result = hasMetadataCommentGuard({ fileContents });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {fileContents: undefined} => returns false', () => {
      const result = hasMetadataCommentGuard({});

      expect(result).toBe(false);
    });
  });
});
