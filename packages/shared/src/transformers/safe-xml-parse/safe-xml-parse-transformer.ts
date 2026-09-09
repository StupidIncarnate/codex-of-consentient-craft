/**
 * PURPOSE: Runs a caller-supplied XML parser and reports rejection as a result rather than a throw.
 * Reach for this over calling `fastXmlParserParseAdapter` directly wherever the string is only
 * SUSPECTED to be XML — a tag-shaped string holding prose is routine, and fast-xml-parser throws
 * on it.
 *
 * USAGE:
 * safeXmlParseTransformer({ xml: '<a><b>1</b></a>', parseXml: fastXmlParserParseAdapter });
 * // Returns { ok: true, value: { a: { b: '1' } } } or { ok: false } when the parser rejects it
 */

type SafeXmlParseResult = { ok: true; value: unknown } | { ok: false };

export const safeXmlParseTransformer = ({
  xml,
  parseXml,
}: {
  xml: string;
  parseXml: (params: { xml: string }) => unknown;
}): SafeXmlParseResult => {
  try {
    return { ok: true, value: parseXml({ xml }) };
  } catch {
    return { ok: false };
  }
};
