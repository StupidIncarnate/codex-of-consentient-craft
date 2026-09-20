import { pixelCoordinateContract } from './pixel-coordinate-contract';
import type { PixelCoordinate } from './pixel-coordinate-contract';

export const PixelCoordinateStub = ({ value }: { value: number } = { value: 0 }): PixelCoordinate =>
  pixelCoordinateContract.parse(value);
