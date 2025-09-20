import type { EslintMessage } from '../../types/eslint-type';

export const isEslintMessage = (obj: unknown): obj is EslintMessage => {
  if (!obj || typeof obj !== 'object') return false;
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.line === 'number' &&
    typeof msg.message === 'string' &&
    typeof msg.severity === 'number' &&
    (msg.ruleId === undefined || typeof msg.ruleId === 'string')
  );
};
