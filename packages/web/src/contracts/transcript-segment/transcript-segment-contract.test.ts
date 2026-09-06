import { transcriptSegmentContract } from './transcript-segment-contract';
import { TranscriptSegmentStub } from './transcript-segment.stub';

describe('transcriptSegmentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {kind: text, text: "hello world"} => parses a text segment', () => {
      const result = transcriptSegmentContract.parse({ kind: 'text', text: 'hello world' });

      expect(result).toStrictEqual({ kind: 'text', text: 'hello world' });
    });

    it('VALID: {kind: image, ordinal: 1, src: data URL} => parses an image segment', () => {
      const result = transcriptSegmentContract.parse({
        kind: 'image',
        ordinal: 1,
        src: 'data:image/png;base64,iVBORw0KGgo=',
      });

      expect(result).toStrictEqual({
        kind: 'image',
        ordinal: 1,
        src: 'data:image/png;base64,iVBORw0KGgo=',
      });
    });
  });

  describe('invalid inputs', () => {
    it("INVALID: {kind: 'video'} => throws for an unknown discriminator", () => {
      expect(() => transcriptSegmentContract.parse({ kind: 'video', text: 'hello' })).toThrow(
        /Invalid discriminator/u,
      );
    });

    it('INVALID: {kind: image, ordinal: 1, no src key} => throws for a missing src field', () => {
      expect(() => transcriptSegmentContract.parse({ kind: 'image', ordinal: 1 })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {kind: image, ordinal: 0, src: "/api/images?path=x"} => throws for a non-positive ordinal', () => {
      expect(() =>
        transcriptSegmentContract.parse({
          kind: 'image',
          ordinal: 0,
          src: '/api/images?path=x',
        }),
      ).toThrow(/greater than 0/u);
    });

    it('INVALID: {kind: image, ordinal: 1, src: ""} => throws for an empty src', () => {
      expect(() => transcriptSegmentContract.parse({ kind: 'image', ordinal: 1, src: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a text segment', () => {
      const result = TranscriptSegmentStub();

      expect(result).toStrictEqual({ kind: 'text', text: 'hello' });
    });

    it('VALID: {kind: image, ordinal, src} => overrides into an image segment with the leftover text key stripped', () => {
      const result = TranscriptSegmentStub({
        kind: 'image',
        ordinal: 1,
        src: '/api/images?path=x',
      });

      expect(result).toStrictEqual({
        kind: 'image',
        ordinal: 1,
        src: '/api/images?path=x',
      });
    });
  });
});
