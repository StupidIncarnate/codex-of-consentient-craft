/**
 * PURPOSE: Recursively walks an object tree and replaces any string value that is purely XML with the parsed object/array form (tag names camelCased)
 *
 * USAGE:
 * inflateXmlStringsTransformer({
 *   value: { content: '<task-notification><task-id>t1</task-id></task-notification>' },
 *   parseXml: fastXmlParserParseAdapter,
 * });
 * // Returns { content: { taskNotification: { taskId: 't1' } } }
 *
 * SCOPE: inflation only fires for strings at object-property positions. Once recursion
 * descends through an array (`insideArray` flag set on subsequent calls), every string
 * inside that subtree is left as-is. Claude CLI packs assistant/user `message.content`
 * as an array of `{type, text|content}` items; each item's text/content is meant for
 * verbatim display (e.g. `<tool_use_error>` from a failed tool call). Inflating those
 * would silently rewrite an error envelope into `{ toolUseError: '...' }`, leaving
 * the renderer with empty TOOL ERROR content. `<task-notification>` (the only consumer
 * that depends on inflation) sits at `message.content` as a string — object-property
 * position — so the scope keeps that flow working.
 *
 * A string the pattern accepts is not necessarily well-formed XML, so `parseXml` is
 * allowed to reject it and the string survives — see the catch below.
 */

import { safeXmlParseTransformer } from '../safe-xml-parse/safe-xml-parse-transformer';
import { snakeKeysToCamelKeysTransformer } from '../snake-keys-to-camel-keys/snake-keys-to-camel-keys-transformer';

const XML_PATTERN = /^\s*<[a-zA-Z][\w-]*\b[^>]*>[\s\S]*<\/[a-zA-Z][\w-]*>\s*$/u;
const TEXT_NODE_KEY = '#text';

export const inflateXmlStringsTransformer = ({
  value,
  parseXml,
  insideArray = false,
}: {
  value: unknown;
  parseXml: (params: { xml: string }) => unknown;
  insideArray?: boolean;
}): typeof value => {
  if (typeof value === 'string') {
    if (insideArray) {
      return value;
    }
    if (!XML_PATTERN.test(value)) {
      return value;
    }
    // XML_PATTERN proves only that the string OPENS and CLOSES with a tag; it cannot prove
    // well-formedness, and prose wrapped in tags carries bare `<` and `&` characters that
    // fast-xml-parser rejects (`duration stayed "<1m"` is a measured case). The only caller
    // runs inside a readline `line` handler, where a throw is an uncaught exception that kills
    // the server process — so an unparseable string stays a string.
    const result = safeXmlParseTransformer({ xml: value, parseXml });
    if (!result.ok) {
      return value;
    }
    const parsed = result.value;
    if (typeof parsed !== 'object' || parsed === null) {
      return value;
    }
    const ownKeys = Reflect.ownKeys(parsed);
    if (ownKeys.length === 0) {
      return value;
    }
    if (ownKeys.length === 1 && ownKeys[0] === TEXT_NODE_KEY) {
      return value;
    }
    return snakeKeysToCamelKeysTransformer({ value: parsed });
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) =>
      inflateXmlStringsTransformer({ value: item, parseXml, insideArray: true }),
    );
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<PropertyKey, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = inflateXmlStringsTransformer({ value: val, parseXml, insideArray });
    }
    return result;
  }

  return value;
};
