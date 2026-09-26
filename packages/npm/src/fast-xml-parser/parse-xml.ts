/**
 * PURPOSE: OUR guarded XML parse, replacing every direct `new XMLParser().parse(xml)` call in the
 * repo. Fixed options (`ignoreAttributes`, `parseTagValue`, `trimValues`) match what every caller
 * configured today. Passes `true` as the parser's own `validationOption`, so malformed XML — an
 * unclosed tag, an empty string, a stray character — surfaces as a thrown Error the way the
 * parser's own validator names it, instead of parsing into a silently wrong shape. Wraps that
 * throw with context so a caller sees which operation failed alongside the parser's own message.
 *
 * USAGE:
 * parseXml({ xml: '<root><child>value</child></root>' });
 * // Returns { root: { child: 'value' } }
 */
import { XMLParser } from 'fast-xml-parser';

export const parseXml = ({ xml }: { xml: string }): unknown => {
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

  try {
    return parser.parse(xml, true) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse XML: ${reason}`, { cause: error });
  }
};
