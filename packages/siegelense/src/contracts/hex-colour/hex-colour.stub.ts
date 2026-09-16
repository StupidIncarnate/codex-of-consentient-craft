import { hexColourContract } from './hex-colour-contract';
import type { HexColour } from './hex-colour-contract';

export const HexColourStub = ({ value }: { value: string } = { value: '#0d0907' }): HexColour =>
  hexColourContract.parse(value);
