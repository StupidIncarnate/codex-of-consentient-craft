import { processGroupIdContract } from './process-group-id-contract';
import type { ProcessGroupId } from './process-group-id-contract';

const DEFAULT_PGID = 4821;

export const ProcessGroupIdStub = (
  { value }: { value: number } = { value: DEFAULT_PGID },
): ProcessGroupId => processGroupIdContract.parse(value);
