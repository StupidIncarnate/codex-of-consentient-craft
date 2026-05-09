import { sliceNameContract } from './slice-name-contract';
import type { SliceName } from './slice-name-contract';

export const SliceNameStub = ({ value }: { value: string } = { value: 'backend' }): SliceName =>
  sliceNameContract.parse(value);
