import { adapterResultContract } from './adapter-result-contract';
import type { AdapterResult } from './adapter-result-contract';

export const AdapterResultStub = (): AdapterResult =>
  adapterResultContract.parse({ success: true as const });
