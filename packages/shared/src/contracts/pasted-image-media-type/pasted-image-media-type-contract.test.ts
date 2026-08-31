import { pastedImageStatics } from '../../statics/pasted-image/pasted-image-statics';
import { pastedImageMediaTypeContract } from './pasted-image-media-type-contract';
import { PastedImageMediaTypeStub } from './pasted-image-media-type.stub';

describe('pastedImageMediaTypeContract', () => {
  it.each(pastedImageStatics.allowedMediaTypes)(
    'VALID: {value: %s} => parses successfully',
    (mediaType) => {
      const value = PastedImageMediaTypeStub({ value: mediaType });

      expect(value).toBe(mediaType);
    },
  );

  it('INVALID: {value: "image/svg+xml"} => throws validation error', () => {
    expect(() => {
      return pastedImageMediaTypeContract.parse('image/svg+xml');
    }).toThrow(/Invalid enum value/u);
  });
});
