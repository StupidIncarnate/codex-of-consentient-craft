import { signoffVerdictContract } from './signoff-verdict-contract';
import type { SignoffVerdict } from './signoff-verdict-contract';

export const SignoffVerdictStub = (
  { value }: { value: string } = { value: 'confirmed' },
): SignoffVerdict => signoffVerdictContract.parse(value);
