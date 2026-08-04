import { blightConcernContract } from './blight-concern-contract';
import type { BlightConcern } from './blight-concern-contract';

export const BlightConcernStub = (
  { value }: { value: string } = { value: 'coverage' },
): BlightConcern => blightConcernContract.parse(value);
