import type { EslintResult } from '../../types/eslint-type';
import { isEslintMessage } from './is-eslint-message';

export const isEslintResult = (obj: unknown): obj is EslintResult => {
  if (!obj || typeof obj !== 'object') return false;
  const result = obj as Record<string, unknown>;
  return (
    Array.isArray(result.messages) &&
    result.messages.every((msg: unknown) => isEslintMessage(msg)) &&
    (result.output === undefined || typeof result.output === 'string')
  );
};
