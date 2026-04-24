import { deletedCountContract } from './deleted-count-contract';
import type { DeletedCount } from './deleted-count-contract';

export const DeletedCountStub = ({ value }: { value: number } = { value: 0 }): DeletedCount =>
  deletedCountContract.parse(value);
