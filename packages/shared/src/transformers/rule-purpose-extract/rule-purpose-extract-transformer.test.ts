import { rulePurposeExtractTransformer } from './rule-purpose-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

const RULE_SOURCE_WITH_PURPOSE = ContentTextStub({
  value: `/**
 * PURPOSE: Bans raw string and number types in favor of Zod contract types
 *
 * USAGE:
 * const rule = ruleBanPrimitivesBroker();
 */
export const ruleBanPrimitivesBroker = () => {};`,
});

const RULE_SOURCE_WITHOUT_PURPOSE = ContentTextStub({
  value: `export const ruleFooBroker = () => {};`,
});

describe('rulePurposeExtractTransformer', () => {
  describe('purpose present', () => {
    it('VALID: {source with PURPOSE comment} => returns purpose text', () => {
      const result = rulePurposeExtractTransformer({ source: RULE_SOURCE_WITH_PURPOSE });

      expect(String(result)).toBe(
        'Bans raw string and number types in favor of Zod contract types',
      );
    });
  });

  describe('purpose absent', () => {
    it('EMPTY: {source without PURPOSE comment} => returns undefined', () => {
      const result = rulePurposeExtractTransformer({ source: RULE_SOURCE_WITHOUT_PURPOSE });

      expect(result).toBe(undefined);
    });
  });

  describe('rule name extraction from path', () => {
    it('VALID: {multiline source starting with PURPOSE} => trims whitespace', () => {
      const result = rulePurposeExtractTransformer({
        source: ContentTextStub({ value: '/* \n * PURPOSE:   Trims spaces  \n */' }),
      });

      expect(String(result)).toBe('Trims spaces');
    });
  });
});
