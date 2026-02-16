/**
 * PURPOSE: Validates if a string is a valid CheckType enum value
 *
 * USAGE:
 * isCheckTypeGuard({value: 'lint'});
 * // Returns true if value is a valid CheckType, false otherwise
 */

import { checkTypeContract } from '../../contracts/check-type/check-type-contract';

export const isCheckTypeGuard = ({ value }: { value?: unknown }): boolean =>
  checkTypeContract.safeParse(value).success;
