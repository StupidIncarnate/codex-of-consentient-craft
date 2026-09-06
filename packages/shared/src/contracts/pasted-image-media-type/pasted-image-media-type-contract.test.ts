import { pastedImageMediaTypeContract } from './pasted-image-media-type-contract';
import { PastedImageMediaTypeStub } from './pasted-image-media-type.stub';
import { pastedImageStatics } from '../../statics/pasted-image/pasted-image-statics';

describe('pastedImageMediaTypeContract', () => {
  describe('valid media types', () => {
    it.each(pastedImageStatics.allowedMediaTypes)(
      'VALID: %s => parses to PastedImageMediaType branded type',
      (mediaType) => {
        const result = pastedImageMediaTypeContract.parse(mediaType);

        expect(result).toBe(mediaType);
      },
    );
  });

  describe('invalid media types', () => {
    it('INVALID: "image/svg+xml" => throws validation error', () => {
      expect(() => pastedImageMediaTypeContract.parse('image/svg+xml')).toThrow(
        "Invalid enum value. Expected 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', received 'image/svg+xml'",
      );
    });

    it('INVALID: 123 => throws validation error for non-string', () => {
      expect(() => pastedImageMediaTypeContract.parse(123 as never)).toThrow(
        "Expected 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', received number",
      );
    });
  });

  describe('stub', () => {
    it('VALID: PastedImageMediaTypeStub() => returns default stub value', () => {
      const result = PastedImageMediaTypeStub();

      expect(result).toBe('image/png');
    });

    it('VALID: PastedImageMediaTypeStub({value: "image/gif"}) => returns custom value', () => {
      const result = PastedImageMediaTypeStub({ value: 'image/gif' });

      expect(result).toBe('image/gif');
    });
  });
});
