/**
 * PURPOSE: Validates if a string matches the RunId pattern (timestamp-hex)
 *
 * USAGE:
 * isRunIdGuard({value: '1739625600000-a3f1'});
 * // Returns true if value matches RunId pattern, false otherwise
 */

import { wardRunResultContract } from '../../contracts/ward-result/ward-result-contract';

export const isRunIdGuard = ({ value }: { value?: unknown }): boolean =>
  wardRunResultContract.shape.runId.safeParse(value).success;
