/**
 * PURPOSE: Blocks a `Write` into a folder type the caller has not loaded `get-folder-detail` for
 * this session, judged from the CALLER's own transcript (the sub-agent's file when `agent_id` is
 * present, never the parent's — see packages/hooks/CLAUDE.md's SubagentStop trap). Every gate
 * before the final one fails open, so an unreadable or ambiguous signal never blocks.
 *
 * USAGE:
 * const result = await HookPreFolderDetailResponder({ input: hookData });
 * // { shouldBlock: true, message } when the transcript records no matching call, else
 * // { shouldBlock: false }
 */
import { transcriptResolveForHookBroker } from '../../../brokers/transcript/resolve-for-hook/transcript-resolve-for-hook-broker';
import { folderDetailWasCalledBroker } from '../../../brokers/folder-detail/was-called/folder-detail-was-called-broker';
import { folderDetailHookDataContract } from '../../../contracts/folder-detail-hook-data/folder-detail-hook-data-contract';
import { hookPreEditResponderResultContract } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { packageSrcFolderTypeTransformer } from '../../../transformers/package-src-folder-type/package-src-folder-type-transformer';
import { folderDetailBlockMessageStatics } from '../../../statics/folder-detail-block-message/folder-detail-block-message-statics';
import type { HookPreEditResponderResult } from '../../../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';

export const HookPreFolderDetailResponder = async ({
  input,
}: {
  input: unknown;
}): Promise<HookPreEditResponderResult> => {
  const parseResult = folderDetailHookDataContract.safeParse(input);

  if (!parseResult.success) {
    return hookPreEditResponderResultContract.parse({ shouldBlock: false });
  }

  const hookData = parseResult.data;

  if (hookData.tool_name !== 'Write') {
    return hookPreEditResponderResultContract.parse({ shouldBlock: false });
  }

  const folderType = packageSrcFolderTypeTransformer({
    filePath: hookData.tool_input.file_path,
  });

  if (folderType === null) {
    return hookPreEditResponderResultContract.parse({ shouldBlock: false });
  }

  const resolvedTranscript = transcriptResolveForHookBroker({
    transcriptPath: hookData.transcript_path,
    ...(hookData.agent_id === undefined ? {} : { agentId: hookData.agent_id }),
  });

  if (resolvedTranscript === null) {
    return hookPreEditResponderResultContract.parse({ shouldBlock: false });
  }

  const lookup = await folderDetailWasCalledBroker({
    transcriptFilePath: filePathContract.parse(String(resolvedTranscript)),
    folderType,
  });

  if (lookup !== 'not-called') {
    return hookPreEditResponderResultContract.parse({ shouldBlock: false });
  }

  return hookPreEditResponderResultContract.parse({
    shouldBlock: true,
    message: `${folderDetailBlockMessageStatics.header}\n\nCall get-folder-detail({ folderType: "${folderType}" }) now.\n\n${folderDetailBlockMessageStatics.rule}\n\n${folderDetailBlockMessageStatics.footer}`,
  });
};
