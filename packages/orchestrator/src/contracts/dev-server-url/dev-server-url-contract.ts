/**
 * PURPOSE: Defines a branded string type for a dev server URL
 *
 * USAGE:
 * devServerUrlContract.parse('http://localhost:3000');
 * // Returns: DevServerUrl branded string
 */

import { z } from 'zod';

export const devServerUrlContract = z.string().url().brand<'DevServerUrl'>();

export type DevServerUrl = z.infer<typeof devServerUrlContract>;
