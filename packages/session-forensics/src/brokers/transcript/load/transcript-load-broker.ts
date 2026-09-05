/**
 * PURPOSE: Turns a bare session or sub-agent id into its parsed transcript records. A work item
 * sometimes never actually dispatches. It might be approved but the CLI never spawned, or it might
 * spawn and get killed before writing anything. A never-dispatched work item is a normal forensic
 * outcome, not an error. So when an id resolves to no file on disk, this broker returns an empty
 * array instead of throwing. A caller building a digest over many ids then does not need a
 * try/catch around each one.
 *
 * USAGE:
 * transcriptLoadBroker({ target: SessionIdStub({ value: 'abc-123' }) });
 * // Returns every parsed TranscriptRecord in that session's transcript. Returns [] when the id
 * // does not resolve to a file.
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
