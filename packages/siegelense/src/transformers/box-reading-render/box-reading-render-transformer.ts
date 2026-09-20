/**
 * PURPOSE: Turns one element's BoxReading into ContentText JSON so a session reading `results --step N`
 * sees the element's exact geometry.
 *
 * USAGE:
 * boxReadingRenderTransformer({ reading: BoxReadingStub() });
 * // Returns '{"ref":26,"x":607,"y":472,"width":66,"height":27,"viewport":{"width":1280,"height":720},"visible":true,"inViewport":true}'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BoxReading } from '../../contracts/box-reading/box-reading-contract';

export const boxReadingRenderTransformer = ({ reading }: { reading: BoxReading }): ContentText =>
  contentTextContract.parse(JSON.stringify(reading));
