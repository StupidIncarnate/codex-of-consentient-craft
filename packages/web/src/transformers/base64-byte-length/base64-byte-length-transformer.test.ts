import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { base64ByteLengthTransformer } from './base64-byte-length-transformer';

// The base64 encoding ratio itself — 4 encoded chars carry every 3 decoded bytes — not a value
// pastedImageStatics holds, so it is fine as a literal here (mirrors the constants of the same
// name inside the transformer under test).
const BASE64_BYTES_PER_GROUP = 3;
const BASE64_CHARS_PER_GROUP = 4;

describe('base64ByteLengthTransformer', () => {
  describe('no padding', () => {
    it('VALID: {dataBase64: "YWJjZGVm"} => decodes to 6 bytes', () => {
      const result = base64ByteLengthTransformer({ dataBase64: 'YWJjZGVm' });

      expect(result).toBe(6);
    });
  });

  describe('padded', () => {
    it('EDGE: {dataBase64: "YWI="} => strips the single "=" before counting', () => {
      const result = base64ByteLengthTransformer({ dataBase64: 'YWI=' });

      expect(result).toBe(2);
    });

    it('EDGE: {dataBase64: "YWJjZA=="} => strips both "=" characters before counting', () => {
      const result = base64ByteLengthTransformer({ dataBase64: 'YWJjZA==' });

      expect(result).toBe(4);
    });
  });

  describe('at the byte ceiling', () => {
    it('EDGE: {dataBase64 length derived from maxBytesPerImage} => decodes to exactly the byte ceiling', () => {
      const strippedLength = Math.ceil(
        (pastedImageStatics.maxBytesPerImage * BASE64_CHARS_PER_GROUP) / BASE64_BYTES_PER_GROUP,
      );

      const result = base64ByteLengthTransformer({ dataBase64: 'A'.repeat(strippedLength) });

      expect(result).toBe(pastedImageStatics.maxBytesPerImage);
    });
  });

  describe('empty', () => {
    it('EMPTY: {dataBase64: ""} => returns 0', () => {
      const result = base64ByteLengthTransformer({ dataBase64: '' });

      expect(result).toBe(0);
    });
  });
});
