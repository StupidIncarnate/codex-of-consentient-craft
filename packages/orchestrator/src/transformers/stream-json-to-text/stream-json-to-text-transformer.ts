/**
 * PURPOSE: Extracts text content from a normalized (camelCase) Claude stream-json line object
 *
 * USAGE:
 * streamJsonToTextTransformer({ parsed: {type:'assistant', message:{content:[{type:'text', text:'Hello'}]}} });
 * // Returns StreamText if text found, null otherwise
 */

import {
  streamTextContract,
  type StreamText,
} from '../../contracts/stream-text/stream-text-contract';

export const streamJsonToTextTransformer = ({ parsed }: { parsed: unknown }): StreamText | null => {
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('type' in parsed) ||
    Reflect.get(parsed, 'type') !== 'assistant'
  ) {
    return null;
  }

  const message: unknown = Reflect.get(parsed, 'message');
  if (typeof message !== 'object' || message === null || !('content' in message)) {
    return null;
  }

  const content: unknown = Reflect.get(message, 'content');
  if (!Array.isArray(content)) {
    return null;
  }

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
};
