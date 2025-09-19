import type { EslintResult } from '../../types/eslint-type';
import { eslintUtilIsEslintMessage } from './eslint-util-is-eslint-message';

export const eslintUtilIsEslintResult = (obj: unknown): obj is EslintResult => {
  if (!obj || typeof obj !== 'object') return false;
  const result = obj as Record<string, unknown>;
  return (
    Array.isArray(result.messages) &&
    result.messages.every((msg: unknown) => eslintUtilIsEslintMessage(msg)) &&
    (result.output === undefined || typeof result.output === 'string')
  );
};
