import { coercedBooleanInputContract } from './coerced-boolean-input-contract';
import type { CoercedBooleanInput } from './coerced-boolean-input-contract';

export const CoercedBooleanInputStub = ({
  value = true,
}: { value?: boolean | 'true' | 'false' } = {}): CoercedBooleanInput =>
  coercedBooleanInputContract.parse(value);
