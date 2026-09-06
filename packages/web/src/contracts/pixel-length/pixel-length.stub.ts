import { pixelLengthContract } from './pixel-length-contract';
import type { PixelLength } from './pixel-length-contract';

export const PixelLengthStub = ({ value }: { value?: number } = {}): PixelLength =>
  pixelLengthContract.parse(value ?? 2000);
