import { pastedImageUploadContract } from './pasted-image-upload-contract';
import { PastedImageUploadStub } from './pasted-image-upload.stub';

describe('pastedImageUploadContract', () => {
  describe('valid pasted image uploads', () => {
    it('VALID: fully populated upload => parses successfully', () => {
      const upload = PastedImageUploadStub({
        mediaType: 'image/jpeg',
        dataBase64: 'iVBORw0KGgo=',
      });

      const parsed = pastedImageUploadContract.parse(upload);

      expect(parsed).toStrictEqual({
        mediaType: 'image/jpeg',
        dataBase64: 'iVBORw0KGgo=',
      });
    });
  });

  describe('invalid pasted image uploads', () => {
    it('INVALID: mediaType outside allowed enum => throws validation error', () => {
      expect(() => {
        pastedImageUploadContract.parse({
          mediaType: 'image/svg+xml' as never,
          dataBase64: 'iVBORw0KGgo=',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: empty-string dataBase64 => throws validation error', () => {
      expect(() => {
        pastedImageUploadContract.parse({
          mediaType: 'image/png',
          dataBase64: '' as never,
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
