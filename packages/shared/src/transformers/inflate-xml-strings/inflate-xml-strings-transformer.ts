/**
 * PURPOSE: Recursively walks an object tree and replaces any string value that is purely XML with the parsed object/array form (tag names camelCased)
 *
 * USAGE:
 * inflateXmlStringsTransformer({
 *   value: { content: '<task-notification><task-id>t1</task-id></task-notification>' },
 *   parseXml: fastXmlParserParseAdapter,
 * });
 * // Returns { content: { taskNotification: { taskId: 't1' } } }
 */

import { snakeKeysToCamelKeysTransformer } from '../snake-keys-to-camel-keys/snake-keys-to-camel-keys-transformer';

const XML_PATTERN = /^\s*<[a-zA-Z][\w-]*\b[^>]*>[\s\S]*<\/[a-zA-Z][\w-]*>\s*$/u;
const TEXT_NODE_KEY = '#text';

export const inflateXmlStringsTransformer = ({
  value,
  parseXml,
}: {
  value: unknown;
  parseXml: (params: { xml: string }) => unknown;
}): unknown => {
  if (typeof value === 'string') {
    if (!XML_PATTERN.test(value)) {
      return value;
    }
    const parsed = parseXml({ xml: value });
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
    return value.map((item: unknown) => inflateXmlStringsTransformer({ value: item, parseXml }));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<PropertyKey, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = inflateXmlStringsTransformer({ value: val, parseXml });
    }
    return result;
  }

  return value;
};
