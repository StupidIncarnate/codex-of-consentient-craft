import type { EslintMessage } from '../../types/eslint-type';

interface MessageCandidate {
  line: unknown;
  message: unknown;
  severity: unknown;
  ruleId?: unknown;
}

const hasRequiredProperties = (obj: object): obj is MessageCandidate =>
  'line' in obj && 'message' in obj && 'severity' in obj;

const validatePropertyTypes = (message: MessageCandidate): boolean =>
  typeof message.line === 'number' &&
  typeof message.message === 'string' &&
  typeof message.severity === 'number' &&
  (message.ruleId === undefined || typeof message.ruleId === 'string');

export const isEslintMessage = (obj: unknown): obj is EslintMessage => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  if (!hasRequiredProperties(obj)) {
    return false;
  }

  return validatePropertyTypes(obj);
};
