import { fastXmlParserParseAdapter } from './fast-xml-parser-parse-adapter';
import { fastXmlParserParseAdapterProxy } from './fast-xml-parser-parse-adapter.proxy';

describe('fastXmlParserParseAdapter', () => {
  describe('simple XML parsing', () => {
    it('VALID: {xml: "<root><child>value</child></root>"} => returns nested object', () => {
      fastXmlParserParseAdapterProxy();

      expect(fastXmlParserParseAdapter({ xml: '<root><child>value</child></root>' })).toStrictEqual(
        { root: { child: 'value' } },
      );
    });

    it('VALID: {xml: "<a>1</a>"} => returns string value (parseTagValue: false)', () => {
      fastXmlParserParseAdapterProxy();

      expect(fastXmlParserParseAdapter({ xml: '<a>1</a>' })).toStrictEqual({
        a: '1',
      });
    });

    it('VALID: task-notification XML => returns structured object', () => {
      fastXmlParserParseAdapterProxy();

      expect(
        fastXmlParserParseAdapter({
          xml: '<task-notification><task-id>t1</task-id><status>completed</status></task-notification>',
        }),
      ).toStrictEqual({
        'task-notification': {
          'task-id': 't1',
          status: 'completed',
        },
      });
    });
  });

  describe('repeated tags become arrays', () => {
    it('VALID: {xml: "<list><item>a</item><item>b</item></list>"} => returns array under repeated tag', () => {
      fastXmlParserParseAdapterProxy();

      expect(
        fastXmlParserParseAdapter({
          xml: '<list><item>a</item><item>b</item></list>',
        }),
      ).toStrictEqual({ list: { item: ['a', 'b'] } });
    });
  });

  describe('whitespace trimming', () => {
    it('VALID: {xml: "<a>  hi  </a>"} => trims surrounding whitespace from values', () => {
      fastXmlParserParseAdapterProxy();

      expect(fastXmlParserParseAdapter({ xml: '<a>  hi  </a>' })).toStrictEqual({
        a: 'hi',
      });
    });
  });

  describe('non-XML inputs', () => {
    it('EMPTY: {xml: ""} => returns empty object', () => {
      fastXmlParserParseAdapterProxy();

      expect(fastXmlParserParseAdapter({ xml: '' })).toStrictEqual({});
    });

    it('VALID: {xml: "plain text"} => returns empty object (no recognized tags)', () => {
      fastXmlParserParseAdapterProxy();

      expect(fastXmlParserParseAdapter({ xml: 'plain text' })).toStrictEqual({});
    });
  });
});
