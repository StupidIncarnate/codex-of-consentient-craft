/**
 * PURPOSE: Wraps fast-xml-parser to parse XML strings into nested object/array structures
 *
 * USAGE:
 * fastXmlParserParseAdapter({ xml: '<root><child>value</child></root>' });
 * // Returns { root: { child: 'value' } }
 */

import { XMLParser } from 'fast-xml-parser';

export const fastXmlParserParseAdapter = ({ xml }: { xml: string }): unknown => {
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });
  return parser.parse(xml) as unknown;
};
