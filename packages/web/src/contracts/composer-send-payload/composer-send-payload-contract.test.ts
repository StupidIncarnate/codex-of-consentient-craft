import { ComposerAttachmentStub } from '../composer-attachment/composer-attachment.stub';

import { composerSendPayloadContract } from './composer-send-payload-contract';
import { ComposerSendPayloadStub } from './composer-send-payload.stub';

describe('composerSendPayloadContract', () => {
  describe('valid inputs', () => {
    it('VALID: {message: two placeholders, attachments: two} => attachments come back in paste order', () => {
      const firstAttachment = ComposerAttachmentStub({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const secondAttachment = ComposerAttachmentStub({
        attachmentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      });

      const result = composerSendPayloadContract.parse({
        message: 'A[Pasted Image 1]B[Pasted Image 2]C',
        attachments: [firstAttachment, secondAttachment],
      });

      expect(result.message).toBe('A[Pasted Image 1]B[Pasted Image 2]C');
      expect(result.attachments.map((attachment) => attachment.attachmentId)).toStrictEqual([
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {attachments: []} => parses a text-only send', () => {
      const result = composerSendPayloadContract.parse({
        message: 'just text, no images',
        attachments: [],
      });

      expect(result).toStrictEqual({
        message: 'just text, no images',
        attachments: [],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {attachments: [an attachment with widthPx 0]} => throws for an attachment failing its own contract', () => {
      expect(() =>
        composerSendPayloadContract.parse({
          message: '[Pasted Image 1]',
          attachments: [{ ...ComposerAttachmentStub(), widthPx: 0 } as never],
        }),
      ).toThrow(/Number must be greater than 0/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a valid send payload carrying a paste-image token', () => {
      const result = ComposerSendPayloadStub();

      expect(result).toStrictEqual({
        message: '[Pasted Image 1]',
        attachments: [ComposerAttachmentStub()],
      });
    });

    it('VALID: {message, attachments: []} => creates a text-only stub', () => {
      const result = ComposerSendPayloadStub({ message: 'just text', attachments: [] });

      expect(result).toStrictEqual({
        message: 'just text',
        attachments: [],
      });
    });
  });
});
