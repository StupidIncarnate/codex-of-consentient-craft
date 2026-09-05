import { wardModeContract } from './ward-mode-contract';
import type { WardMode } from './ward-mode-contract';

export const WardModeStub = ({ value }: { value: string } = { value: 'committed' }): WardMode =>
  wardModeContract.parse(value);
