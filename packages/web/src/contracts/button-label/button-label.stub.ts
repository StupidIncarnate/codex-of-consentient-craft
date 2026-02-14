import { buttonLabelContract } from './button-label-contract';
import type { ButtonLabel } from './button-label-contract';

export const ButtonLabelStub = ({ value }: { value?: string } = {}): ButtonLabel =>
  buttonLabelContract.parse(value ?? 'CREATE');
