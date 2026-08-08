/**
 * PURPOSE: Orders a tool's input so the argument a reader cares about comes first, which is what
 * lets a caller take field[0] as "the interesting one" rather than whatever key JSON happened to
 * serialise first. Matching is naming-convention insensitive on purpose: the same tool reaches this
 * app as `file_path` from one harness and `filePath` from another, and a map that knows only one
 * spelling silently falls back to JSON order — which is how a row ends up summarising an Edit as
 * its `replaceAll` flag.
 *
 * USAGE:
 * formatToolInputTransformer({toolName: 'Bash', toolInput: '{"command":"ls -la"}'});
 * // Returns {fields: [{key: 'command', value: 'ls -la', isLong: false}]}
 */

import { formattedToolInputContract } from '../../contracts/formatted-tool-input/formatted-tool-input-contract';
import type { FormattedToolInput } from '../../contracts/formatted-tool-input/formatted-tool-input-contract';
import { parsedToolInputContract } from '../../contracts/parsed-tool-input/parsed-tool-input-contract';

const LONG_VALUE_THRESHOLD = 120;
const NON_ALPHANUMERIC = /[^a-z0-9]/gu;

const priorityFieldsMap = new Map([
  ['Write', ['file_path']],
  ['Edit', ['file_path']],
  ['Bash', ['command']],
  ['Read', ['file_path']],
  ['Grep', ['pattern', 'path']],
  ['Glob', ['pattern']],
  ['Task', ['description', 'subagent_type']],
]);

export const formatToolInputTransformer = ({
  toolName,
  toolInput,
}: {
  toolName: string;
  toolInput: string;
}): FormattedToolInput | null => {
  if (toolInput === '') {
    return null;
  }

  const rawParsed = ((): unknown => {
    try {
      return JSON.parse(toolInput) as unknown;
    } catch {
      return undefined;
    }
  })();

  if (typeof rawParsed !== 'object' || rawParsed === null || Array.isArray(rawParsed)) {
    return null;
  }

  const parsedResult = parsedToolInputContract.safeParse(rawParsed);
  if (!parsedResult.success) {
    return null;
  }
  const parsed = parsedResult.data;

  const allKeys = Object.keys(parsed);
  const priorityKeys = priorityFieldsMap.get(toolName) ?? [];
  const priorityRanks = priorityKeys.map((key) => key.toLowerCase().replace(NON_ALPHANUMERIC, ''));

  const orderedKeys = [
    ...allKeys
      .filter((key) => priorityRanks.includes(key.toLowerCase().replace(NON_ALPHANUMERIC, '')))
      .sort(
        (left, right) =>
          priorityRanks.indexOf(left.toLowerCase().replace(NON_ALPHANUMERIC, '')) -
          priorityRanks.indexOf(right.toLowerCase().replace(NON_ALPHANUMERIC, '')),
      ),
    ...allKeys.filter(
      (key) => !priorityRanks.includes(key.toLowerCase().replace(NON_ALPHANUMERIC, '')),
    ),
  ];

  const fields = orderedKeys.map((key) => {
    const rawValue = parsed[key as keyof typeof parsed];
    const value = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);

    return {
      key,
      value,
      isLong: value.length > LONG_VALUE_THRESHOLD,
    };
  });

  return formattedToolInputContract.parse({ fields });
};
