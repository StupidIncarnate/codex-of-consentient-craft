/**
 * PURPOSE: Turns a bare session or sub-agent id into its parsed transcript records. A work item
 * that never actually dispatched (approved but the CLI was never spawned, or spawned and killed
 * before writing anything) is a normal forensic outcome, not an error — so an id that resolves to
 * no file on disk returns an empty array rather than throwing, and a caller building a digest over
 * many ids doesn't need a try/catch around every one of them.
 *
 * USAGE:
 * transcriptLoadBroker({ target: SessionIdStub({ value: 'abc-123' }) });
 * // Returns every parsed TranscriptRecord in that session's transcript, or [] when unresolved
 */

import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';
import type { SessionId } from '@dungeonmaster/shared/contracts';
import { transcriptResolveBroker } from '../resolve/transcript-resolve-broker';
import { jsonlToRecordsTransformer } from '../../../transformers/jsonl-to-records/jsonl-to-records-transformer';
import type { TranscriptRecord } from '../../../contracts/transcript-record/transcript-record-contract';

export const transcriptLoadBroker = ({
  target,
  parentSessionId,
}: {
  target: SessionId;
  parentSessionId?: SessionId;
}): readonly TranscriptRecord[] => {
  const transcriptPath = transcriptResolveBroker({
    target,
    ...(parentSessionId === undefined ? {} : { parentSessionId }),
  });

  if (transcriptPath === undefined) {
    return [];
  }

  const contents = fsReadFileSyncAdapter({ filePath: transcriptPath });
  return jsonlToRecordsTransformer({ contents });
};
