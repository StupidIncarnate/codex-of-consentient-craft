import type { StubArgument } from '@dungeonmaster/shared/@types';
import { fieldValuesContract } from './field-values-contract';
import type { FieldValues } from './field-values-contract';

export const FieldValuesStub = ({ ...props }: StubArgument<FieldValues> = {}): FieldValues =>
  fieldValuesContract.parse({
    ...props,
  });
