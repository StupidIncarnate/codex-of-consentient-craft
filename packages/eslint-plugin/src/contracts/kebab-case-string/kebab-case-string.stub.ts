import { kebabCaseStringContract } from './kebab-case-string-contract';
import type { KebabCaseString } from './kebab-case-string-contract';

export const KebabCaseStringStub = (
  { value }: { value: string } = { value: 'test-string' },
): KebabCaseString => kebabCaseStringContract.parse(value);
