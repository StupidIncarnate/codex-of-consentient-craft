/**
 * PURPOSE: The line shape `@dungeonmaster/testing` appends to its open-handle report during a jest
 * run. Reach for this at the moment ward READS that file; `openHandleContract` is what ward reports
 * outward, and carries jest's own `name`/`message`/`stack` wording instead.
 *
 * Ward defines the wire shape rather than importing the producer's type, because the file arrives
 * from outside the process and has to be validated on the way in like any other outside input.
 *
 * USAGE:
 * testingOpenHandleFindingContract.parse(JSON.parse(line));
 * // Returns {kind, testPath, stack}
 */

import { z } from 'zod';

export const testingOpenHandleFindingContract = z.object({
  kind: z.string().min(1).brand<'TestingOpenHandleKind'>(),
  testPath: z.string().min(1).brand<'TestingOpenHandleTestPath'>(),
  stack: z.string().brand<'TestingOpenHandleStack'>(),
});

export type TestingOpenHandleFinding = z.infer<typeof testingOpenHandleFindingContract>;
