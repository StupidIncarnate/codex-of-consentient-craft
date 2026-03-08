import { displayLabelContract } from './display-label-contract';
import type { DisplayLabel } from './display-label-contract';

export const DisplayLabelStub = ({ value }: { value?: string } = {}): DisplayLabel =>
  displayLabelContract.parse(value ?? 'Display label');
