import { pixelDimensionContract } from './pixel-dimension-contract';
import type { PixelDimension } from './pixel-dimension-contract';

export const PixelDimensionStub = ({ value }: { value?: number } = {}): PixelDimension =>
  pixelDimensionContract.parse(value ?? 8);
