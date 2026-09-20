import { pixelCountContract, type PixelCount } from './pixel-count-contract';

export const PixelCountStub = ({ value }: { value: number } = { value: 2 }): PixelCount =>
  pixelCountContract.parse(value);
