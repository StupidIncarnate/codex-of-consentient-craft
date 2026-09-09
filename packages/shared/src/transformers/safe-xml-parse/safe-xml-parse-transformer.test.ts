import { safeXmlParseTransformer } from './safe-xml-parse-transformer';

const parseXmlThrowing = (): unknown => {
  throw new Error('readTagExp returned undefined at position 36');
};

const parseXmlReturning = ({ xml }: { xml: string }): unknown => ({ parsed: xml });

describe('safeXmlParseTransformer', () => {
  describe('parser succeeds', () => {
    it('VALID: {xml: "<a><b>1</b></a>"} => returns ok with the parser value', () => {
      expect(
        safeXmlParseTransformer({ xml: '<a><b>1</b></a>', parseXml: parseXmlReturning }),
      ).toStrictEqual({ ok: true, value: { parsed: '<a><b>1</b></a>' } });
    });

    it('VALID: parser returns null => returns ok carrying null', () => {
      expect(safeXmlParseTransformer({ xml: '<a/>', parseXml: () => null })).toStrictEqual({
        ok: true,
        value: null,
      });
    });

    it('EMPTY: {xml: ""} => returns ok with whatever the parser gave back', () => {
      expect(safeXmlParseTransformer({ xml: '', parseXml: () => ({}) })).toStrictEqual({
        ok: true,
        value: {},
      });
    });
  });

  describe('parser throws', () => {
    it('ERROR: parser throws on malformed XML => returns {ok: false} instead of propagating', () => {
      expect(
        safeXmlParseTransformer({
          xml: '<task-notification>duration stayed "<1m"</task-notification>',
          parseXml: parseXmlThrowing,
        }),
      ).toStrictEqual({ ok: false });
    });
  });
});
