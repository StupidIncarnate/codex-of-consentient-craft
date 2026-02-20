import { formattedTokenLabelContract } from './formatted-token-label-contract';
import type { FormattedTokenLabel } from './formatted-token-label-contract';

export const FormattedTokenLabelStub = ({ value }: { value?: string } = {}): FormattedTokenLabel =>
  formattedTokenLabelContract.parse(value ?? '29.4k');
