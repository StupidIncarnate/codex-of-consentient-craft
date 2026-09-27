/**
 * PURPOSE: A real parsed value, built by actually calling this subpath's own `parseXml` wrapper —
 * never a hand-typed object standing in for what the real parser would produce.
 *
 * USAGE:
 * const parsed = ParseXmlResultStub();
 * // Returns the real value parseXml() produces for a small default XML document
 */
import { parseXml } from './parse-xml';

export const ParseXmlResultStub = ({
  xml = '<root><child>value</child></root>',
}: { xml?: string } = {}): ReturnType<typeof parseXml> => parseXml({ xml });
