/**
 * PURPOSE: Determines if a session is new by checking transcript file size
 *
 * USAGE:
 * const isNew = await sessionIsNewBroker({ transcriptPath: '/path/to/transcript.jsonl' });
 * // Returns true if transcript file is small or doesn't exist (new session)
 */
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { isNewSessionGuard } from '../../../guards/is-new-session/is-new-session-guard';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { SessionStartHookData } from '../../../contracts/session-start-hook-data/session-start-hook-data-contract';

export const sessionIsNewBroker = async ({
  transcriptPath,
}: {
  transcriptPath: SessionStartHookData['transcript_path'];
}): Promise<boolean> => {
  try {
    // Convert TranscriptPath to FilePath for fsStatAdapter
    const filePath = filePathContract.parse(transcriptPath);
    const stats = await fsStatAdapter({ filePath });
    return isNewSessionGuard({ fileSize: stats.size });
  } catch {
    // File doesn't exist - this is a new session (omit fileSize property)
    return isNewSessionGuard({});
  }
};
