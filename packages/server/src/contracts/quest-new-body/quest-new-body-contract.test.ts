import { PastedImageUploadStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { questNewBodyContract } from './quest-new-body-contract';
import { QuestNewBodyStub } from './quest-new-body.stub';

describe('questNewBodyContract', () => {
  describe('valid bodies', () => {
    it('VALID: {message} => parses with questType omitted', () => {
      const result = questNewBodyContract.parse({ message: 'Build the login flow' });

      expect(result).toStrictEqual({ message: 'Build the login flow' });
    });

    it('VALID: {message, questType: "bug-hunt"} => parses with questType', () => {
      const result = questNewBodyContract.parse(
        QuestNewBodyStub({ message: 'Rows do not render', questType: 'bug-hunt' }),
      );

      expect(result).toStrictEqual({ message: 'Rows do not render', questType: 'bug-hunt' });
    });

    it('VALID: {message, questType: "feature"} => parses with questType', () => {
      const result = questNewBodyContract.parse(
        QuestNewBodyStub({ message: 'Add auth', questType: 'feature' }),
      );

      expect(result).toStrictEqual({ message: 'Add auth', questType: 'feature' });
    });

    it('VALID: {message, images: [first, second]} => images come back in posted order', () => {
      const firstImage = PastedImageUploadStub();
      const secondImage = PastedImageUploadStub({ dataBase64: 'aGVsbG8gd29ybGQ=' });

      const result = questNewBodyContract.parse({
        message: 'Build the login flow',
        images: [firstImage, secondImage],
      });

      expect(result).toStrictEqual({
        message: 'Build the login flow',
        images: [firstImage, secondImage],
      });
    });

    it('VALID: {message} (no images) => images is absent from the parsed result rather than present-and-undefined', () => {
      const result = questNewBodyContract.parse({ message: 'Build the login flow' });

      expect(result).toStrictEqual({ message: 'Build the login flow' });
    });

    it('VALID: {message, questType, images} => parses with both questType and images intact', () => {
      const image = PastedImageUploadStub();

      const result = questNewBodyContract.parse({
        message: 'Build the login flow',
        questType: 'bug-hunt',
        images: [image],
      });

      expect(result).toStrictEqual({
        message: 'Build the login flow',
        questType: 'bug-hunt',
        images: [image],
      });
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {} (empty object) => throws Required error for message', () => {
      expect(() => questNewBodyContract.parse({})).toThrow(/message/u);
    });

    it('INVALID: {message: ""} (empty string) => throws min length error', () => {
      expect(() => questNewBodyContract.parse({ message: '' })).toThrow(
        /String must contain at least 1/u,
      );
    });

    it('INVALID: {message, questType: "bogus"} => throws Invalid enum value', () => {
      expect(() => questNewBodyContract.parse({ message: 'Add auth', questType: 'bogus' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {images: maxImagesPerMessage + 1} => throws validation error', () => {
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      expect(() => {
        questNewBodyContract.parse({ message: 'Build the login flow', images });
      }).toThrow(/too_big/u);
    });
  });
});
