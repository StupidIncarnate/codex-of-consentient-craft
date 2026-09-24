/**
 * PURPOSE: The human-facing name of a lane spec — `laneSpecConventionStatics.browsered` ('stack')
 * or `.headless` ('api'), the only two `laneSpecFindBroker` recognises, though this brand itself
 * stays an OPEN string rather than a closed enum. A browserless spec is not a special case here —
 * an operational flow has no screen, so its instance boots only the servers, and the name carries
 * no signal about that. Reach for this over specHashContract when the question is "which spec is
 * this", never "is this spec's content still the one a profile was measured against" — two specs
 * can share a name across two commits and mean different things, and only the hash tells them apart.
 *
 * USAGE:
 * specNameContract.parse('api');
 * // Returns: 'api' as SpecName
 */

import { z } from 'zod';

export const specNameContract = z.string().min(1).brand<'SpecName'>();

export type SpecName = z.infer<typeof specNameContract>;
