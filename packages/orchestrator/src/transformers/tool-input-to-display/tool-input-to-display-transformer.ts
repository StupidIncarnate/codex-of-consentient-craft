/**
 * PURPOSE: Transforms a tool input object into a formatted display string with key="value" pairs
 *
 * USAGE:
 * toolInputToDisplayTransformer({ input: { pattern: '*.ts', path: 'src/' } });
 * // Returns 'pattern="*.ts" path="src/"' as branded ToolInputDisplay
 */

import {
  toolInputDisplayContract,
  type ToolInputDisplay,
} from '../../contracts/tool-input-display/tool-input-display-contract';
import { toolDisplayConfigStatics } from '../../statics/tool-display-config/tool-display-config-statics';

export const toolInputToDisplayTransformer = ({
  input,
}: {
  input: Record<string, unknown>;
}): ToolInputDisplay => {
  const keys = Object.keys(input);

  if (keys.length === 0) {
    return toolInputDisplayContract.parse('');
  }

  const { ordered: priorityKeys } = toolDisplayConfigStatics.priorityKeys;
  const { maxParams, maxValueLength } = toolDisplayConfigStatics.limits;
  const { ellipsis } = toolDisplayConfigStatics.formatting;

  // Sort keys: priority keys first (in order), then remaining keys alphabetically
  const sortedKeys = keys.sort((a, b) => {
    const aPriorityIndex = priorityKeys.findIndex((pk) => pk === a);
    const bPriorityIndex = priorityKeys.findIndex((pk) => pk === b);

    const aIsPriority = aPriorityIndex !== -1;
    const bIsPriority = bPriorityIndex !== -1;

    // Both are priority keys - sort by priority order
    if (aIsPriority && bIsPriority) {
      return aPriorityIndex - bPriorityIndex;
    }

    // Only a is a priority key - a comes first
    if (aIsPriority) {
      return -1;
    }

    // Only b is a priority key - b comes first
    if (bIsPriority) {
      return 1;
    }

    // Neither is a priority key - sort alphabetically
    return a.localeCompare(b);
  });

  // Take first N keys
  const selectedKeys = sortedKeys.slice(0, maxParams);
  const hasMoreKeys = sortedKeys.length > maxParams;

  // Format each key-value pair
  const pairs = selectedKeys.map((key) => {
    const value = input[key];

    // Format value to string based on type
    const stringValue =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : value === null
            ? 'null'
            : value === undefined
              ? 'undefined'
              : Array.isArray(value)
                ? `[${value.length} items]`
                : typeof value === 'object'
                  ? '{...}'
                  : typeof value === 'function'
                    ? '[function]'
                    : typeof value === 'symbol'
                      ? value.toString()
                      : typeof value === 'bigint'
                        ? value.toString()
                        : '[unknown]';

    // Truncate if needed
    const truncatedValue =
      stringValue.length <= maxValueLength
        ? stringValue
        : `${stringValue.slice(0, maxValueLength - ellipsis.length)}${ellipsis}`;

    return `${key}="${truncatedValue}"`;
  });

  // Join pairs and add ellipsis if more keys available
  const result = hasMoreKeys ? `${pairs.join(' ')} ${ellipsis}` : pairs.join(' ');

  return toolInputDisplayContract.parse(result);
};
