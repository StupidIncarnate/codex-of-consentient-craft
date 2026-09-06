import { PastedImageUploadStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { messageBodyContract } from './message-body-contract';
import { MessageBodyStub } from './message-body.stub';

describe('messageBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {message: "hello"} => parses successfully', () => {
      const result = messageBodyContract.parse({ message: 'hello' });

      expect(result).toStrictEqual({ message: 'hello' });
    });

    it('VALID: stub default => returns default message', () => {
      const result = MessageBodyStub();

      expect(result).toStrictEqual({ message: 'hello world' });
    });

    it('VALID: {message: "hello", images: [first, second]} => images come back in posted order', () => {
      const firstImage = PastedImageUploadStub();
      const secondImage = PastedImageUploadStub({ dataBase64: 'aGVsbG8gd29ybGQ=' });

      const result = messageBodyContract.parse({
        message: 'hello',
        images: [firstImage, secondImage],
      });

      expect(result).toStrictEqual({
        message: 'hello',
        images: [firstImage, secondImage],
      });
    });

    it('VALID: {message: "hello"} => images is absent from the parsed result rather than present-and-undefined', () => {
      const result = messageBodyContract.parse({ message: 'hello' });

      expect(result).toStrictEqual({ message: 'hello' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {message: ""} => throws validation error', () => {
      expect(() => {
        messageBodyContract.parse({ message: '' });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        messageBodyContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {images: maxImagesPerMessage + 1} => throws validation error', () => {
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      expect(() => {
        messageBodyContract.parse({ message: 'hello', images });
      }).toThrow(/too_big/u);
    });
  });
});
