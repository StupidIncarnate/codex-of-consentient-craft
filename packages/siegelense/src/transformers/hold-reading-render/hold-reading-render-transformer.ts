/**
 * PURPOSE: Turns a HoldReading into ContentText JSON so a session reading `results --step N`
 * sees the frames, differing count, reading, and shot paths. Rebuilds the JSON object under its own
 * key names rather than `JSON.stringify(reading)`ing the contract straight through: `holdReading
 * Contract`'s own field is `verdict` (packages/siegelense/CLAUDE.md: "a command returns a READING,
 * never a verdict on a unit"), and this render layer is where that field renames to `reading` for the
 * text a session actually sees, without touching the contract itself.
 *
 * USAGE:
 * holdReadingRenderTransformer({ reading: HoldReadingStub() });
 * // Returns '{"frames":4,"differing":0,"reading":"NOTHING CHANGED across 4.5s","shots":["/tmp/shot1.png"]}'
 */

import type { HoldReading } from '../../contracts/hold-reading/hold-reading-contract';

export const holdReadingRenderTransformer = ({ reading }: { reading: HoldReading }): string =>
  JSON.stringify({
    frames: reading.frames,
    differing: reading.differing,
    reading: reading.verdict,
    shots: reading.shots,
  });
