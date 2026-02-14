import { buttonVariantContract } from './button-variant-contract';
import type { ButtonVariant } from './button-variant-contract';

export const ButtonVariantStub = ({ value }: { value?: string } = {}): ButtonVariant =>
  buttonVariantContract.parse(value ?? 'primary');
