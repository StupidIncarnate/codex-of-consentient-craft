/**
 * PURPOSE: Extracts text content from a Claude stream-json output line
 *
 * USAGE:
 * streamJsonToTextTransformer({ line: StreamJsonLineStub({ value: '{"type":"assistant","message":{"content":[{"type":"text","text":"Hello"}]}}' }) });
 * // Returns StreamText if text found, null otherwise
 */

import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';
import {
  streamTextContract,
  type StreamText,
} from '../../contracts/stream-text/stream-text-contract';

export const streamJsonToTextTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): StreamText | null => {
  try {
    const parsed: unknown = JSON.parse(line);

    // Check if this is an assistant message
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('type' in parsed) ||
      Reflect.get(parsed, 'type') !== 'assistant'
    ) {
      return null;
    }

    // Get message content
    const message: unknown = Reflect.get(parsed, 'message');
    if (typeof message !== 'object' || message === null || !('content' in message)) {
      return null;
    }

    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content)) {
      return null;
    }

    // Collect all text content by reducing over content items
    const result = content.reduce<StreamText | null>((acc, item) => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        Reflect.get(item, 'type') === 'text' &&
        'text' in item
      ) {
        const text: unknown = Reflect.get(item, 'text');
        if (typeof text === 'string') {
          const current = acc === null ? '' : acc;
          return streamTextContract.parse(current + text);
        }
      }
      return acc;
    }, null);

    return result;
  } catch {
    return null;
  }
};
