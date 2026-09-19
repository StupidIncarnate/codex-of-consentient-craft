/**
 * PURPOSE: Turns a HoldReading into ContentText JSON so a session reading `results --step N`
 * sees the frames, differing count, verdict, and shot paths.
 *
 * USAGE:
 * holdReadingRenderTransformer({ reading: HoldReadingStub() });
 * // Returns '{"frames":4,"differing":0,"verdict":"NOTHING CHANGED across 4.5s","shots":["/tmp/shot1.png"]}'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { HoldReading } from '../../contracts/hold-reading/hold-reading-contract';

export const holdReadingRenderTransformer = ({ reading }: { reading: HoldReading }): ContentText =>
  contentTextContract.parse(JSON.stringify(reading));
