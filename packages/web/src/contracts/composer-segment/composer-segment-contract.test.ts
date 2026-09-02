import { composerSegmentContract } from './composer-segment-contract';
import { ComposerSegmentStub } from './composer-segment.stub';

describe('composerSegmentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {kind: text, text: "hello world"} => parses a text segment', () => {
      const result = composerSegmentContract.parse({ kind: 'text', text: 'hello world' });

      expect(result).toStrictEqual({ kind: 'text', text: 'hello world' });
    });

    it('VALID: {kind: image, attachmentId} => parses an image segment', () => {
      const result = composerSegmentContract.parse({
        kind: 'image',
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual({
        kind: 'image',
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });

    it('EMPTY: {kind: text, text: ""} => parses a caret-only run between two thumbnails', () => {
      const result = composerSegmentContract.parse({ kind: 'text', text: '' });

      expect(result).toStrictEqual({ kind: 'text', text: '' });
    });
  });

  describe('invalid inputs', () => {
    it("INVALID: {kind: 'video'} => throws for an unknown discriminator", () => {
      expect(() => composerSegmentContract.parse({ kind: 'video', text: 'hello' })).toThrow(
        /Invalid discriminator/u,
      );
    });

    it('INVALID: {kind: image, attachmentId: "not-a-uuid"} => throws for a non-uuid attachmentId', () => {
      expect(() =>
        composerSegmentContract.parse({ kind: 'image', attachmentId: 'not-a-uuid' }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {kind: text, no text key} => throws for a missing text field', () => {
      expect(() => composerSegmentContract.parse({ kind: 'text' })).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a text segment', () => {
      const result = ComposerSegmentStub();

      expect(result).toStrictEqual({ kind: 'text', text: 'hello' });
    });

    it('VALID: {kind: image, attachmentId} => overrides into an image segment with the leftover text key stripped', () => {
      const result = ComposerSegmentStub({
        kind: 'image',
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual({
        kind: 'image',
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });
});
