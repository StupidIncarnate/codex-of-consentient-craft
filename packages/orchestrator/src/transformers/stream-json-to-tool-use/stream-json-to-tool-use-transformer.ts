/**
 * PURPOSE: Extracts tool_use content from a normalized (camelCase) Claude stream-json line object and formats for display
 *
 * USAGE:
 * streamJsonToToolUseTransformer({ parsed: {type:'assistant', message:{content:[{type:'tool_use', name:'Task', input:{pattern:'*.ts'}}]}} });
 * // Returns '[Task] pattern="*.ts"\n' as ToolUseDisplay if tool_use found, null otherwise
 */

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import {
  toolUseDisplayContract,
  type ToolUseDisplay,
} from '../../contracts/tool-use-display/tool-use-display-contract';
import { toolInputToDisplayTransformer } from '../tool-input-to-display/tool-input-to-display-transformer';

export const streamJsonToToolUseTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): ToolUseDisplay | null => {
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

  const result = content.reduce<ToolUseDisplay | null>((acc, rawItem) => {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) return acc;
    const item = itemParse.data;
    if (item.type !== 'tool_use' || typeof item.name !== 'string') {
      return acc;
    }

    const inputRaw = item.input;
    const input =
      typeof inputRaw === 'object' && inputRaw !== null && !Array.isArray(inputRaw)
        ? Object.fromEntries(Object.entries(inputRaw))
        : {};

    const inputDisplay = toolInputToDisplayTransformer({ input });
    const formattedInput = inputDisplay.length > 0 ? ` ${inputDisplay}` : '';

    const formatted = `[${String(item.name)}]${formattedInput}`;
    const current = acc === null ? '' : `${acc.replace(/\n$/u, '')} `;
    return toolUseDisplayContract.parse(`${current}${formatted}\n`);
  }, null);

  return result;
};
