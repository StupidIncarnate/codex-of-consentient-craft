import { elapsedTextContract } from './elapsed-text-contract';
import type { ElapsedText } from './elapsed-text-contract';

export const ElapsedTextStub = ({ value }: { value: string } = { value: '14m' }): ElapsedText =>
  elapsedTextContract.parse(value);
