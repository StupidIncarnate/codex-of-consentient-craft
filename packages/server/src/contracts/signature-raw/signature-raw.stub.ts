import { signatureRawContract } from './signature-raw-contract';
import type { SignatureRaw } from './signature-raw-contract';

export const SignatureRawStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: '({ x }: { x: number }): string',
  },
): SignatureRaw => signatureRawContract.parse(value);
