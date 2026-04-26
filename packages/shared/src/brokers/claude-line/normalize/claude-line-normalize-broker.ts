/**
 * PURPOSE: Single funnel — parses a raw Claude JSONL line, camelCases all keys recursively, and inflates any XML string values into nested object/array form
 *
 * USAGE:
 * claudeLineNormalizeBroker({ rawLine: '{"session_id":"abc","tool_use_result":{"agent_id":"a1"}}' });
 * // Returns { sessionId: 'abc', toolUseResult: { agentId: 'a1' } } or null if JSON.parse failed
 */

import { fastXmlParserParseAdapter } from '../../../adapters/fast-xml-parser/parse/fast-xml-parser-parse-adapter';
import {
  normalizedLineContract,
  type NormalizedLine,
} from '../../../contracts/normalized-line/normalized-line-contract';
import { inflateXmlStringsTransformer } from '../../../transformers/inflate-xml-strings/inflate-xml-strings-transformer';
import { safeJsonParseTransformer } from '../../../transformers/safe-json-parse/safe-json-parse-transformer';
import { snakeKeysToCamelKeysTransformer } from '../../../transformers/snake-keys-to-camel-keys/snake-keys-to-camel-keys-transformer';

export const claudeLineNormalizeBroker = ({
  rawLine,
}: {
  rawLine: string;
}): NormalizedLine | null => {
  const parseResult = safeJsonParseTransformer({ value: rawLine });
  if (!parseResult.ok) {
    return null;
  }
  const camelKeyed = snakeKeysToCamelKeysTransformer({ value: parseResult.value });
  const inflated = inflateXmlStringsTransformer({
    value: camelKeyed,
    parseXml: fastXmlParserParseAdapter,
  });
  return normalizedLineContract.parse(inflated);
};
