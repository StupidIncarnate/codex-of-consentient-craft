/**
 * PURPOSE: Defines the observability prefix the launcher prepends to a UUID when minting a ProcessId. Two values are valid: `chat` (chaoswhisperer interactive sessions) and `proc` (every orchestration-loop dispatched agent — codeweaver, flowrider, siegemaster, spiritmender, warpgate, ward).
 *
 * USAGE:
 * processIdPrefixContract.parse('proc');
 * // Returns the validated prefix string; reject anything outside the union
 */

import { z } from 'zod';

export const processIdPrefixContract = z.enum(['chat', 'proc']);

export type ProcessIdPrefix = z.infer<typeof processIdPrefixContract>;
