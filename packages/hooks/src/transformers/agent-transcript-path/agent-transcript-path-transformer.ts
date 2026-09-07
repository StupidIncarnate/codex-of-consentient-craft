/**
 * PURPOSE: The hook payload's transcript_path is sometimes the main session file and sometimes
 * already the sub-agent's own file, so a broker can't check one fixed location. This enumerates
 * every place the sub-agent's transcript could be, in the order a broker should check disk for
 * them, without touching the filesystem itself.
 *
 * USAGE:
 * agentTranscriptPathTransformer({
 *   transcriptPath: '/home/user/.claude/projects/-repo/session123.jsonl',
 *   agentId: 'abc',
 * });
 * // Returns [
 * //   '/home/user/.claude/projects/-repo/session123/subagents/agent-abc.jsonl',
 * //   '/home/user/.claude/projects/-repo/agent-abc.jsonl',
 * // ] as branded AbsoluteFilePath entries
 */
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

const JSONL_SUFFIX = '.jsonl';

export const agentTranscriptPathTransformer = ({
  transcriptPath,
  agentId,
}: {
  transcriptPath: string;
  agentId: string;
}): readonly AbsoluteFilePath[] => {
  const agentBasename = `agent-${agentId}.jsonl`;
  const lastSlashIndex = transcriptPath.lastIndexOf('/');
  const basename =
    lastSlashIndex === -1 ? transcriptPath : transcriptPath.slice(lastSlashIndex + 1);
  const dirname = lastSlashIndex === -1 ? '' : transcriptPath.slice(0, lastSlashIndex);
  const strippedPath = transcriptPath.endsWith(JSONL_SUFFIX)
    ? transcriptPath.slice(0, transcriptPath.length - JSONL_SUFFIX.length)
    : transcriptPath;

  const rawCandidates = [
    ...(basename === agentBasename ? [transcriptPath] : []),
    `${strippedPath}/subagents/${agentBasename}`,
    `${dirname}/${agentBasename}`,
  ];

  return rawCandidates
    .filter((candidate, index) => rawCandidates.indexOf(candidate) === index)
    .map((candidate) => absoluteFilePathContract.parse(candidate));
};
