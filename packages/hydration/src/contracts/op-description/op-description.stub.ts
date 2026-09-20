import { opDescriptionContract } from './op-description-contract';
import type { OpDescription } from './op-description-contract';

export const OpDescriptionStub = (
  { value }: { value: string } = { value: 'create quest[0:1]' },
): OpDescription => opDescriptionContract.parse(value);
