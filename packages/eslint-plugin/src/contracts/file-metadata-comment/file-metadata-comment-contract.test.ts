import { FileMetadataCommentStub } from './file-metadata-comment.stub';

describe('fileMetadataCommentContract', () => {
  describe('valid metadata', () => {
    it('VALID: {purpose: "Test purpose", usage: "code example"} => parses successfully', () => {
      const result = FileMetadataCommentStub({
        purpose: 'Test purpose description',
        usage: 'testFunction({ input: "value" })',
      });

      expect(result).toStrictEqual({
        purpose: 'Test purpose description',
        usage: 'testFunction({ input: "value" })',
      });
    });

    it('VALID: {purpose, usage, related} => parses successfully with optional field', () => {
      const result = FileMetadataCommentStub({
        purpose: 'Test purpose',
        usage: 'code example',
        related: 'other-function, another-guard',
      });

      expect(result).toStrictEqual({
        purpose: 'Test purpose',
        usage: 'code example',
        related: 'other-function, another-guard',
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
