import { pixelCoordinateContract } from './pixel-coordinate-contract';
import type { PixelCoordinate } from './pixel-coordinate-contract';

export const PixelCoordinateStub = ({ value }: { value?: string } = {}): PixelCoordinate =>
  pixelCoordinateContract.parse(value ?? '5 0 #ff4500');
