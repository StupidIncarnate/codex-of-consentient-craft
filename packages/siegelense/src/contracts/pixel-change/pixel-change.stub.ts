import { pixelChangeContract } from './pixel-change-contract';
import type { PixelChange } from './pixel-change-contract';

export const PixelChangeStub = ({ value }: { value: string } = { value: '38%' }): PixelChange =>
  pixelChangeContract.parse(value);
