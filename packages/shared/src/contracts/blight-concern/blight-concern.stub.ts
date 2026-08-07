import { blightConcernContract } from './blight-concern-contract';
import type { BlightConcern } from './blight-concern-contract';

export const BlightConcernStub = (
  { value }: { value: string } = { value: 'craft' },
): BlightConcern => blightConcernContract.parse(value);
