/**
 * PURPOSE: Turns the JSONL that `@dungeonmaster/testing` appends during a jest run into ward's own
 * OpenHandle shape. Reach for this over reading jest's `openHandles` field whenever the run used
 * WORKERS — jest collects handles on the main thread only, so that field is empty there, and asking
 * for it forces the whole run in band.
 *
 * A line that parses as JSON but does not match the shape is DROPPED, so a producer that adds a
 * field cannot redden a run. A line that is not JSON at all THROWS, which is why the caller runs
 * this inside the same try that already tolerates jest handing back non-JSON output — several
 * workers append to one file, and a run killed mid-write can leave a half-line behind.
 *
 * USAGE:
 * openHandleReportParseTransformer({ content: '{"kind":"setInterval","testPath":"a.test.ts","stack":"at x"}' });
 * // Returns [{name: 'setInterval', message: 'setInterval still armed in a.test.ts', stack: 'at x'}]
 */

import { openHandleContract } from '../../contracts/open-handle/open-handle-contract';
import type { OpenHandle } from '../../contracts/open-handle/open-handle-contract';
import { testingOpenHandleFindingContract } from '../../contracts/testing-open-handle-finding/testing-open-handle-finding-contract';

export const openHandleReportParseTransformer = ({ content }: { content?: string }): OpenHandle[] =>
  (content ?? '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .flatMap((line) => {
      const parsed = testingOpenHandleFindingContract.safeParse(JSON.parse(line) as unknown);
      return parsed.success ? [parsed.data] : [];
    })
    .map((finding) =>
      openHandleContract.parse({
        name: String(finding.kind),
        message: `${String(finding.kind)} still armed when ${String(finding.testPath)} finished`,
        stack: String(finding.stack),
      }),
    );
