import { qaDispositionContract } from './qa-disposition-contract';
import type { QaDisposition } from './qa-disposition-contract';

export const QaDispositionStub = (
  { value }: { value: string } = { value: 'walked' },
): QaDisposition => qaDispositionContract.parse(value);
