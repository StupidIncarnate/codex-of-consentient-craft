import { cssDimensionContract } from './css-dimension-contract';
import type { CssDimension } from './css-dimension-contract';

export const CssDimensionStub = ({ value }: { value?: number | string } = {}): CssDimension =>
  cssDimensionContract.parse(value ?? '100%');
