/**
 * PURPOSE: Defines the two platforms the platform-crossing check tells apart — the browser a
 * `frontend-react` package ships to, and the Node process every other detected package type runs
 * in. A `library` package has no platform of its own and is never branded with this contract.
 *
 * USAGE:
 * platformContract.parse('browser');
 * // Returns: 'browser' as Platform
 */

import { z } from 'zod';

export const platformContract = z.enum(['browser', 'node']).brand<'Platform'>();

export type Platform = z.infer<typeof platformContract>;
