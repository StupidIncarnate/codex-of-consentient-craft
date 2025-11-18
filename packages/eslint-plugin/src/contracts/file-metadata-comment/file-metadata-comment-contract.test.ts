import { FileMetadataCommentStub } from './file-metadata-comment.stub';
import { fileMetadataCommentContract } from './file-metadata-comment-contract';

describe('fileMetadataCommentContract', () => {
  describe('valid metadata', () => {
    it('VALID: {purpose: "Test purpose", usage: "code example"} => parses successfully', () => {
      fileMetadataCommentContract.safeParse({});
      const result = FileMetadataCommentStub({
        purpose: 'Test purpose description',
        usage: 'testFunction({ input: "value" })',
      });

      expect(result).toStrictEqual({
        purpose: 'Test purpose description',
        usage: 'testFunction({ input: "value" })',
      });
    });

    it('VALID: {purpose, usage} => parses successfully with optional field', () => {
      const result = FileMetadataCommentStub({
        purpose: 'Test purpose',
        usage: 'code example',
      });

      expect(result).toStrictEqual({
        purpose: 'Test purpose',
        usage: 'code example',
      });
    });

    it('VALID: {purpose, usage} => parses successfully without optional related field', () => {
      const result = FileMetadataCommentStub({
        purpose: 'Validates user permissions',
        usage: 'hasPermission({ user, permission })',
      });

      expect(result).toStrictEqual({
        purpose: 'Validates user permissions',
        usage: 'hasPermission({ user, permission })',
      });
    });
  });
});
