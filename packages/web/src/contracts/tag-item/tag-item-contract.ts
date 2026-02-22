/**
 * PURPOSE: Defines a branded string type for tag list item values
 *
 * USAGE:
 * tagItemContract.parse('typescript');
 * // Returns: TagItem branded string
 */

import { z } from 'zod';

export const tagItemContract = z.string().min(1).brand<'TagItem'>();

export type TagItem = z.infer<typeof tagItemContract>;
