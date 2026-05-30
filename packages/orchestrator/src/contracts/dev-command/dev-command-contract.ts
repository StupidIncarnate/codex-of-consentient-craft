/**
 * PURPOSE: Defines a branded string type for a dev server launch command
 *
 * USAGE:
 * devCommandContract.parse('npm run dev');
 * // Returns: DevCommand branded string
 */

import { z } from 'zod';

export const devCommandContract = z.string().min(1).brand<'DevCommand'>();

export type DevCommand = z.infer<typeof devCommandContract>;
