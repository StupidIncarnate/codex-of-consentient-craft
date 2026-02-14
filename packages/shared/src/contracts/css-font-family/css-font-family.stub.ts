/**
 * PURPOSE: Stub factory for CssFontFamily branded string type
 *
 * USAGE:
 * const font = CssFontFamilyStub({ value: 'monospace' });
 * // Returns branded CssFontFamily string
 */
import { cssFontFamilyContract, type CssFontFamily } from './css-font-family-contract';

export const CssFontFamilyStub = (
  { value }: { value: string } = { value: 'monospace' },
): CssFontFamily => cssFontFamilyContract.parse(value);
