/**
 * PURPOSE: Answers whether a transcript records a `get-folder-detail` call for one folder type,
 * as a tri-state so a read/parse failure (`undetermined`) can never collapse into a confirmed
 * absence (`not-called`) — only the confirmed absence may ever block a write. Reach for this over
 * transcriptToolInvocationsExtractTransformer when the caller wants one folder type's yes/no/unsure
 * answer rather than every tool_use call in the transcript.
 *
 * USAGE:
 * await folderDetailWasCalledBroker({ transcriptFilePath, folderType });
 * // Returns 'called' | 'not-called' | 'undetermined'
 */
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import type { FolderType } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { transcriptLineContract } from '../../../contracts/transcript-line/transcript-line-contract';
import { folderDetailCallLookupContract } from '../../../contracts/folder-detail-call-lookup/folder-detail-call-lookup-contract';
import type { FolderDetailCallLookup } from '../../../contracts/folder-detail-call-lookup/folder-detail-call-lookup-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

// The bare name also matches the namespaced tool name, which is what the prefilter needs — a line
// mentioning either form is a parse candidate, but only the namespaced form counts as a real call.
const GET_FOLDER_DETAIL_BARE_NAME = 'get-folder-detail';
const GET_FOLDER_DETAIL_TOOL_NAME = `mcp__dungeonmaster__${GET_FOLDER_DETAIL_BARE_NAME}` as const;

export const folderDetailWasCalledBroker = async ({
  transcriptFilePath,
  folderType,
}: {
  transcriptFilePath: FilePath;
  folderType: FolderType;
}): Promise<FolderDetailCallLookup> => {
  const transcript = await fsReadFileAdapter({ filePath: transcriptFilePath }).catch(() => null);

  if (transcript === null) {
    return folderDetailCallLookupContract.parse('undetermined');
  }

  const lines = transcript.split('\n').filter((line) => line.trim() !== '');

  // "Did anything parse" has to be asked of EVERY line, never of the prefiltered candidates below:
  // a transcript that simply never mentions the tool yields zero candidates, and that is precisely
  // the case this hook exists to block on rather than wave through as undetermined. `.some` stops
  // at the first parseable line, so this stays cheap on the multi-MB transcripts it reads.
  const anyLineParsed = lines.some((line) => safeJsonParseTransformer({ value: line }).ok);

  if (!anyLineParsed) {
    return folderDetailCallLookupContract.parse('undetermined');
  }

  const called = lines
    .filter((line) => line.includes(GET_FOLDER_DETAIL_BARE_NAME))
    .some((line) => {
      const parsed = safeJsonParseTransformer({ value: line });
      if (!parsed.ok) {
        return false;
      }

      const lineResult = transcriptLineContract.safeParse(parsed.value);
      if (!lineResult.success) {
        return false;
      }

      const { content } = lineResult.data.message;
      if (typeof content === 'string') {
        return false;
      }

      return content.some(
        (item) =>
          item.type === 'tool_use' &&
          item.name === GET_FOLDER_DETAIL_TOOL_NAME &&
          item.input?.folderType === folderType,
      );
    });

  return folderDetailCallLookupContract.parse(called ? 'called' : 'not-called');
};
