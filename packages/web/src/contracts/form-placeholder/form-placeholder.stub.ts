import { formPlaceholderContract } from './form-placeholder-contract';
import type { FormPlaceholder } from './form-placeholder-contract';

export const FormPlaceholderStub = ({ value }: { value?: string } = {}): FormPlaceholder =>
  formPlaceholderContract.parse(value ?? 'Enter value...');
