import { GuildIdStub, PastedImageUploadStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { guildMessageBodyContract } from './guild-message-body-contract';
import { GuildMessageBodyStub } from './guild-message-body.stub';

describe('guildMessageBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {guildId, message: "hi"} => parses successfully', () => {
      const guildId = GuildIdStub();
      const result = GuildMessageBodyStub({ guildId, message: 'hi' });

      expect(result.message).toBe('hi');
    });

    it('VALID: {guildId, message, images: two images} => images come back in the posted order', () => {
      const guildId = GuildIdStub();
      const firstImage = PastedImageUploadStub({ mediaType: 'image/png' });
      const secondImage = PastedImageUploadStub({ mediaType: 'image/jpeg' });

      const result = guildMessageBodyContract.parse({
        guildId,
        message: 'two images',
        images: [firstImage, secondImage],
      });

      expect(result).toStrictEqual({
        guildId,
        message: 'two images',
        images: [firstImage, secondImage],
      });
    });

    it('VALID: {guildId, message, no images} => images is absent from the parsed result', () => {
      const guildId = GuildIdStub();

      const result = guildMessageBodyContract.parse({ guildId, message: 'no images' });

      expect(result).toStrictEqual({ guildId, message: 'no images' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing message} => throws validation error', () => {
      expect(() => {
        guildMessageBodyContract.parse({ guildId: GuildIdStub() });
      }).toThrow(/Required/u);
    });

    it('INVALID: {images: maxImagesPerMessage + 1} => throws validation error', () => {
      const guildId = GuildIdStub();
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      expect(() => {
        guildMessageBodyContract.parse({ guildId, message: 'too many', images });
      }).toThrow(/too_big/u);
    });
  });
});
