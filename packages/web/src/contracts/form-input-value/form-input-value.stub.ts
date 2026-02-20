import { formInputValueContract } from './form-input-value-contract';
import type { FormInputValue } from './form-input-value-contract';

export const FormInputValueStub = ({ value }: { value?: string } = {}): FormInputValue =>
  formInputValueContract.parse(value ?? 'stub-input-value');
