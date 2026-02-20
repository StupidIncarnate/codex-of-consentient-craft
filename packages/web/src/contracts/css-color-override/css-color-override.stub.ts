import { cssColorOverrideContract } from './css-color-override-contract';
import type { CssColorOverride } from './css-color-override-contract';

export const CssColorOverrideStub = ({ value }: { value?: string } = {}): CssColorOverride =>
  cssColorOverrideContract.parse(value ?? '#ff6b35');
