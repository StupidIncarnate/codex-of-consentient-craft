import { parseXml } from './parse-xml';
import { parseXmlProxy } from './parse-xml.proxy';

describe('parseXml', () => {
  it('VALID: {xml: a well-formed document} => returns the parsed object', () => {
    parseXmlProxy();

    expect(parseXml({ xml: '<root><child>value</child></root>' })).toStrictEqual({
      root: { child: 'value' },
    });
  });

  it("INVALID: {xml: an unclosed tag} => throws naming the parser's own message", () => {
    parseXmlProxy();

    expect(() => parseXml({ xml: '<root><child>value</child>' })).toThrow(
      /^Failed to parse XML: Unclosed tag 'root'\.:1:1$/u,
    );
  });

  it("EMPTY: {xml: an empty string} => throws naming the parser's own message", () => {
    parseXmlProxy();

    expect(() => parseXml({ xml: '' })).toThrow(
      /^Failed to parse XML: Start tag expected\.:1:undefined$/u,
    );
  });
});
