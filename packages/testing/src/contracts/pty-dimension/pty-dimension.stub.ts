import { ptyDimensionContract, type PtyDimension } from './pty-dimension-contract';

export const PtyDimensionStub = ({ value }: { value: number } = { value: 80 }): PtyDimension =>
  ptyDimensionContract.parse(value);
