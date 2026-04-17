/**
 * PURPOSE: Recursively converts snake_case AND kebab-case object keys to camelCase across all nested objects and arrays
 *
 * USAGE:
 * snakeKeysToCamelKeysTransformer({ value: { tool_use_id: 'x', 'task-id': 't1', message: { input_tokens: 5 } } });
 * // Returns { toolUseId: 'x', taskId: 't1', message: { inputTokens: 5 } }
 */

export const snakeKeysToCamelKeysTransformer = ({ value }: { value: unknown }): unknown => {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => snakeKeysToCamelKeysTransformer({ value: item }));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<PropertyKey, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const camelKey = key.replace(/[_-]([a-z0-9])/gu, (match) => {
        const [, letter] = match.split('');
        return (letter ?? '').toUpperCase();
      });
      result[camelKey] = snakeKeysToCamelKeysTransformer({ value: val });
    }
    return result;
  }

  return value;
};
