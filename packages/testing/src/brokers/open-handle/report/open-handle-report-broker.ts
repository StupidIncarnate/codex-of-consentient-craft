/**
 * PURPOSE: Turns whatever timers a finished suite left running into findings named after that
 * suite, and appends them as JSONL for ward to read. Reach for this from the jest setup file's
 * `afterAll`; `openHandleTrackingBroker` is the lower half and names no suite.
 *
 * APPEND, not write: jest workers run suites concurrently and every one of them reports into the
 * same file, so a write would drop the other workers' findings.
 *
 * USAGE:
 * openHandleReportBroker({testPath: 'packages/a/src/x.test.ts', reportPath: '/tmp/handles.jsonl'});
 * // Returns the findings, and appends one JSON line per finding
 */

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';
import { openHandleFindingContract } from '../../../contracts/open-handle-finding/open-handle-finding-contract';
import type { OpenHandleFinding } from '../../../contracts/open-handle-finding/open-handle-finding-contract';
import { openHandleTrackingBroker } from '../tracking/open-handle-tracking-broker';

export const openHandleReportBroker = ({
  testPath,
  reportPath,
}: {
  testPath: string;
  reportPath?: string | undefined;
}): readonly OpenHandleFinding[] => {
  const findings = openHandleTrackingBroker
    .pending()
    .map((armed) =>
      openHandleFindingContract.parse({ kind: armed.kind, testPath, stack: armed.stack }),
    );

  // Clearing here and not on the next watch is what bounds the list to ONE suite: a worker runs
  // many suites in the same process, and without this every later suite would inherit the earlier
  // suites' timers and report them again under its own name.
  openHandleTrackingBroker.clear();

  if (reportPath === undefined || findings.length === 0) {
    return findings;
  }

  fsAppendFileAdapter({
    filePath: reportPath,
    content: fileContentContract.parse(
      `${findings.map((finding) => JSON.stringify(finding)).join('\n')}\n`,
    ),
  });

  return findings;
};
