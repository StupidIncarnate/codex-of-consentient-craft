/**
 * PURPOSE: Validates if a string matches the RunId pattern (timestamp-hex)
 *
 * USAGE:
 * isRunIdGuard({value: '1739625600000-a3f1'});
 * // Returns true if value matches RunId pattern, false otherwise
 */

import { runIdContract } from '../../contracts/run-id/run-id-contract';

export const isRunIdGuard = ({ value }: { value?: unknown }): boolean =>
  runIdContract.safeParse(value).success;
