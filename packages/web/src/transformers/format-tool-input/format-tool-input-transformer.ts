/**
 * PURPOSE: Formats tool input JSON into structured fields with priority ordering per tool name
 *
 * USAGE:
 * formatToolInputTransformer({toolName: 'Bash', toolInput: '{"command":"ls -la"}'});
 * // Returns {fields: [{key: 'command', value: 'ls -la', isLong: false}]}
 */

import { formattedToolInputContract } from '../../contracts/formatted-tool-input/formatted-tool-input-contract';
import type { FormattedToolInput } from '../../contracts/formatted-tool-input/formatted-tool-input-contract';

const LONG_VALUE_THRESHOLD = 120;

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

  let parsed: unknown = null;

  try {
    parsed = JSON.parse(toolInput) as unknown;
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const allKeys = Object.keys(parsed);
  const priorityKeys = priorityFieldsMap.get(toolName) ?? [];

  const orderedKeys = [
    ...priorityKeys.filter((key) => allKeys.includes(key)),
    ...allKeys.filter((key) => !priorityKeys.includes(key)),
  ];

  const fields = orderedKeys.map((key) => {
    const rawValue: unknown = Reflect.get(parsed, key);
    const value = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);

    return {
      key,
      value,
      isLong: value.length > LONG_VALUE_THRESHOLD,
    };
  });

  return formattedToolInputContract.parse({ fields });
};
