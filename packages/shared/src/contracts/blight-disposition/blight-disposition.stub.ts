import { blightDispositionContract } from './blight-disposition-contract';
import type { BlightDisposition } from './blight-disposition-contract';

export const BlightDispositionStub = (
  { value }: { value: string } = { value: 'reviewed' },
): BlightDisposition => blightDispositionContract.parse(value);
