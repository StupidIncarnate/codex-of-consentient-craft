import { uploadProgressPostContract } from './upload-progress-post-contract';
import { UploadProgressPostStub } from './upload-progress-post.stub';

describe('uploadProgressPostContract', () => {
  describe('valid input', () => {
    it('VALID: {url, body, onProgress} => parses and returns the exact url', () => {
      const result = UploadProgressPostStub({ url: '/api/quests/abc/messages' });

      expect(result.url).toBe('/api/quests/abc/messages');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {url: ""} => throws for empty url', () => {
      expect(() => UploadProgressPostStub({ url: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {onProgress: "nope"} => throws for non-function onProgress', () => {
      expect(() =>
        uploadProgressPostContract.parse({
          url: '/api/quests/abc/messages',
          body: {},
          onProgress: 'nope' as never,
        }),
      ).toThrow(/Invalid input/u);
    });
  });
});
