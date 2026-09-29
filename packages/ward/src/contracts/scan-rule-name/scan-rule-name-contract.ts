/**
 * PURPOSE: Names the one ESLint rule a scan forces to error. Reach for this over a bare string so a
 * rule id typed on the command line is validated once, at the boundary, in whichever spelling ESLint
 * itself uses (`@dungeonmaster/<rule>`, `@typescript-eslint/<rule>` or a bare core name).
 *
 * USAGE:
 * scanRuleNameContract.parse('@dungeonmaster/ban-workspace-export-mocks');
 * // Returns: ScanRuleName branded string
 */

import { z } from '#gateway/npm/zod';

export const scanRuleNameContract = z.string().min(1).regex(/^\S+$/u).brand<'ScanRuleName'>();

export type ScanRuleName = z.infer<typeof scanRuleNameContract>;
