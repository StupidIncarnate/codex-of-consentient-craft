import { cssSpacingContract } from './css-spacing-contract';
import type { CssSpacing } from './css-spacing-contract';

export const CssSpacingStub = ({ value }: { value?: number } = {}): CssSpacing =>
  cssSpacingContract.parse(value ?? 0);
