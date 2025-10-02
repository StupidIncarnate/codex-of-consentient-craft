import type { EslintResult } from '../../types/eslint-type';
import { isEslintMessage } from '../is-eslint-message/is-eslint-message';

interface ResultCandidate {
  messages: unknown;
  output?: unknown;
}

const hasResultProperties = (obj: object): obj is ResultCandidate => 'messages' in obj;

const validateResultTypes = (result: ResultCandidate): boolean =>
  Array.isArray(result.messages) &&
  result.messages.every((message: unknown) => isEslintMessage(message)) &&
  (result.output === undefined || typeof result.output === 'string');

export const isEslintResult = (obj: unknown): obj is EslintResult => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }

  if (!hasResultProperties(obj)) {
    return false;
  }

  return validateResultTypes(obj);
};
