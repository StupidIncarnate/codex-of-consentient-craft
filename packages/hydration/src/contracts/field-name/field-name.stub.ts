import { fieldNameContract } from './field-name-contract';
import type { FieldName } from './field-name-contract';

export const FieldNameStub = ({ value }: { value: string } = { value: 'status' }): FieldName =>
  fieldNameContract.parse(value);
