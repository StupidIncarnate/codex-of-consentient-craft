import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { isAllowedPasteMediaTypeGuard } from './is-allowed-paste-media-type-guard';

describe('isAllowedPasteMediaTypeGuard', () => {
  describe('allowed media types', () => {
    it.each(pastedImageStatics.allowedMediaTypes)(
      'VALID: {mediaType: %s} => returns true',
      (mediaType) => {
        expect(isAllowedPasteMediaTypeGuard({ mediaType })).toBe(true);
      },
    );
  });

  describe('disallowed media types', () => {
    it('INVALID: {mediaType: "image/bmp"} => returns false', () => {
      expect(isAllowedPasteMediaTypeGuard({ mediaType: 'image/bmp' })).toBe(false);
    });

    // An SVG is a script vector, not a raster image — the one refusal a reader is most likely to
    // assume was an oversight.
    it('INVALID: {mediaType: "image/svg+xml"} => returns false', () => {
      expect(isAllowedPasteMediaTypeGuard({ mediaType: 'image/svg+xml' })).toBe(false);
    });

    it('INVALID: {mediaType: "text/plain"} => returns false', () => {
      expect(isAllowedPasteMediaTypeGuard({ mediaType: 'text/plain' })).toBe(false);
    });
  });

  describe('near-miss formatting', () => {
    it('EDGE: {mediaType: "IMAGE/PNG"} => returns false', () => {
      expect(isAllowedPasteMediaTypeGuard({ mediaType: 'IMAGE/PNG' })).toBe(false);
    });

    it('EDGE: {mediaType: "image/png; charset=binary"} => returns false', () => {
      expect(isAllowedPasteMediaTypeGuard({ mediaType: 'image/png; charset=binary' })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {mediaType: ""} => returns false', () => {
      expect(isAllowedPasteMediaTypeGuard({ mediaType: '' })).toBe(false);
    });
  });
});
