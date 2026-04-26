/**
 * PURPOSE: Extracts text content from a normalized (camelCase) Claude stream-json line object
 *
 * USAGE:
 * streamJsonToTextTransformer({ parsed: {type:'assistant', message:{content:[{type:'text', text:'Hello'}]}} });
 * // Returns StreamText if text found, null otherwise
 */

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import {
  streamTextContract,
  type StreamText,
} from '../../contracts/stream-text/stream-text-contract';

export const streamJsonToTextTransformer = ({ parsed }: { parsed: unknown }): StreamText | null => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return null;
  }
  const line = lineParse.data;
  if (line.type !== 'assistant') {
    return null;
  }

  const content = line.message?.content;
  if (!Array.isArray(content)) {
    return null;
  }

  const result = content.reduce<StreamText | null>((acc, rawItem) => {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) return acc;
    const item = itemParse.data;
    if (item.type !== 'text' || typeof item.text !== 'string') {
      return acc;
    }
    const current = acc === null ? '' : acc;
    return streamTextContract.parse(current + String(item.text));
  }, null);

  return result;
};
