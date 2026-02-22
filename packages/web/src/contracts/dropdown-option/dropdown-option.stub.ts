import { dropdownOptionContract } from './dropdown-option-contract';
import type { DropdownOption } from './dropdown-option-contract';

export const DropdownOptionStub = ({ value }: { value?: string } = {}): DropdownOption =>
  dropdownOptionContract.parse(value ?? 'high');
