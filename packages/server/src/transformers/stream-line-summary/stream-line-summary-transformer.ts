/**
 * PURPOSE: Extracts a human-readable summary from a parsed Claude CLI stream JSON line for dev logging
 *
 * USAGE:
 * streamLineSummaryTransformer({ parsed: JSON.parse('{"type":"assistant","subtype":"text"}') });
 * // Returns ContentText 'type=assistant, subtype=text'
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { streamPreviewMaxLengthStatics } from '../../statics/stream-preview-max-length/stream-preview-max-length-statics';

const COST_DECIMAL_PLACES = 4;

export const streamLineSummaryTransformer = ({ parsed }: { parsed: unknown }): ContentText => {
  if (typeof parsed !== 'object' || parsed === null) {
    return contentTextContract.parse('type=unknown');
  }

  const parts: ContentText[] = [];

  const lineType =
    typeof Reflect.get(parsed, 'type') === 'string'
      ? String(Reflect.get(parsed, 'type'))
      : 'unknown';

  parts.push(contentTextContract.parse(`type=${lineType}`));

  const subtype: unknown = Reflect.get(parsed, 'subtype');

  if (typeof subtype === 'string') {
    parts.push(contentTextContract.parse(`subtype=${subtype}`));
  }

  if (lineType === 'assistant') {
    const message: unknown = Reflect.get(parsed, 'message');

    if (typeof message === 'object' && message !== null) {
      const content: unknown = Reflect.get(message, 'content');

      if (Array.isArray(content)) {
        const textBlock: unknown = content.find(
          (block: unknown) =>
            typeof block === 'object' && block !== null && Reflect.get(block, 'type') === 'text',
        );

        if (typeof textBlock === 'object' && textBlock !== null) {
          const text = String(Reflect.get(textBlock, 'text') ?? '');
          const preview =
            text.length > streamPreviewMaxLengthStatics.maxLength
              ? `${text.slice(0, streamPreviewMaxLengthStatics.maxLength)}...`
              : text;
          parts.push(contentTextContract.parse(`preview="${preview.replace(/\n/gu, '\\n')}"`));
        }

        const toolBlocks: unknown[] = content.filter(
          (block: unknown) =>
            typeof block === 'object' &&
            block !== null &&
            Reflect.get(block, 'type') === 'tool_use',
        );

        if (toolBlocks.length > 0) {
          const toolNames = toolBlocks.map((block: unknown) =>
            String(Reflect.get(block as object, 'name') ?? '?'),
          );
          parts.push(contentTextContract.parse(`tools=[${toolNames.join(',')}]`));
        }
      }
    }
  }

  if (lineType === 'result') {
    const costUsd: unknown = Reflect.get(parsed, 'cost_usd');

    if (typeof costUsd === 'number') {
      parts.push(contentTextContract.parse(`cost=$${costUsd.toFixed(COST_DECIMAL_PLACES)}`));
    }

    const durationMs: unknown = Reflect.get(parsed, 'duration_ms');

    if (typeof durationMs === 'number') {
      parts.push(contentTextContract.parse(`duration=${String(durationMs)}ms`));
    }

    const numTurns: unknown = Reflect.get(parsed, 'num_turns');

    if (typeof numTurns === 'number') {
      parts.push(contentTextContract.parse(`turns=${String(numTurns)}`));
    }
  }

  return contentTextContract.parse(parts.join(', '));
};
