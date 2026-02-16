import { checkTypeContract } from './check-type-contract';
import type { CheckType } from './check-type-contract';

export const CheckTypeStub = ({ value }: { value?: string } = {}): CheckType =>
  checkTypeContract.parse(value ?? 'lint');
