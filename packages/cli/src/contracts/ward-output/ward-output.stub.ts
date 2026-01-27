import { wardOutputContract } from './ward-output-contract';

type WardOutput = ReturnType<typeof wardOutputContract.parse>;

export const WardOutputStub = ({ value }: { value?: string } = {}): WardOutput =>
  wardOutputContract.parse(value ?? '');
