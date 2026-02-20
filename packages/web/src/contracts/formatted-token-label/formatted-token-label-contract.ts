/**
 * PURPOSE: Defines a branded string type for human-readable token count labels like "29.4k" or "150"
 *
 * USAGE:
 * formattedTokenLabelContract.parse('29.4k');
 * // Returns: FormattedTokenLabel branded string
 */

import { z } from 'zod';

export const formattedTokenLabelContract = z.string().min(1).brand<'FormattedTokenLabel'>();

export type FormattedTokenLabel = z.infer<typeof formattedTokenLabelContract>;
