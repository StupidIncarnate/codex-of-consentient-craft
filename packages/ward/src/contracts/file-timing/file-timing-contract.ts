/**
 * PURPOSE: Defines a per-file timing entry extracted from tool output
 *
 * USAGE:
 * fileTimingContract.parse({filePath: 'src/index.ts', durationMs: 150, testMs: 20, rulesMs: 0});
 * // Returns: FileTiming validated object
 */

import { z } from 'zod';
import { gitRelativePathContract } from '../git-relative-path/git-relative-path-contract';
import { durationMsContract } from '../duration-ms/duration-ms-contract';

export const fileTimingContract = z.object({
  filePath: gitRelativePathContract,
  // Jest's `endTime - startTime` for the suite. It spans everything the file cost the run,
  // including the ts-jest LanguageService and TypeScript program that the FIRST file to transform
  // in a package pays for on everyone's behalf — measured at 46.2s against 83ms of actual test
  // bodies, and reproduced by forcing a different file to run first, which moved the whole cost
  // onto that file instead. Ranking on this alone accuses whichever file jest happened to start.
  durationMs: durationMsContract,
  // Summed jest assertion durations for the suite: what the test bodies themselves cost, with no
  // compile in it. The gap between the two is what tells a reader the file is not the problem.
  testMs: durationMsContract.default(0),
  // The lint half of that same pair: every `stats.times.passes[].rules` entry plus `fix`, and NOT
  // `parse`, which is where @typescript-eslint's TypeScript program is built once per eslint
  // process and charged to whichever file the parser reached first. One 40-file web run read 8.5s
  // wall on such a file against 0.5s of its own rule work, and named a different arbitrary file in
  // every neighbouring batch. Separate from `testMs` because lint runs no tests: printing rule work
  // as "in tests" would be a lie, and a jest suite's two numbers must stay comparable to each other.
  rulesMs: durationMsContract.default(0),
});

export type FileTiming = z.infer<typeof fileTimingContract>;
