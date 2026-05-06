/**
 * PURPOSE: Defines the observability prefix the launcher prepends to a UUID when minting a ProcessId. Three values are valid: `chat` (chaoswhisperer interactive sessions), `design` (glyphsmith interactive sessions), and `proc` (every orchestration-loop dispatched agent — pathseeker, codeweaver, lawbringer, siegemaster, spiritmender, blightwarden, ward).
 *
 * USAGE:
 * processIdPrefixContract.parse('proc');
 * // Returns the validated prefix string; reject anything outside the union
 */

import { z } from 'zod';

export const processIdPrefixContract = z.enum(['chat', 'design', 'proc']);

export type ProcessIdPrefix = z.infer<typeof processIdPrefixContract>;
