/**
 * PURPOSE: Responds to Antigravity PreToolUse hook events by delegating to PreBash, PreEdit,
 * and PreSearch logic based on the tool being invoked
 *
 * USAGE:
 * const result = await HookAgyPreToolResponder({ hookInput: parsedStdin });
 * // Returns AgyPreToolDecision indicating allow/deny and optional overwrite arguments
 */

import { isBlockedGitDestructiveCommandGuard } from '../../../guards/is-blocked-git-destructive-command/is-blocked-git-destructive-command-guard';
import { isBlockedQualityCommandGuard } from '../../../guards/is-blocked-quality-command/is-blocked-quality-command-guard';
import { isBlockedSearchCommandGuard } from '../../../guards/is-blocked-search-command/is-blocked-search-command-guard';
import { isWardPipedCommandGuard } from '../../../guards/is-ward-piped-command/is-ward-piped-command-guard';
import { wardSuggestionMessageTransformer } from '../../../transformers/ward-suggestion-message/ward-suggestion-message-transformer';
import { stripWardPipeCommandTransformer } from '../../../transformers/strip-ward-pipe-command/strip-ward-pipe-command-transformer';
import { gitDestructiveBlockStatics } from '../../../statics/git-destructive-block/git-destructive-block-statics';
import { discoverSuggestionMessageStatics } from '../../../statics/discover-suggestion-message/discover-suggestion-message-statics';
import { violationMessageStatics } from '../../../statics/violation-message/violation-message-statics';
import { violationsCheckNewBroker } from '../../../brokers/violations/check-new/violations-check-new-broker';
import { writeToolInputContract } from '../../../contracts/write-tool-input/write-tool-input-contract';
import { editToolInputContract } from '../../../contracts/edit-tool-input/edit-tool-input-contract';
import { bashToolInputContract } from '../../../contracts/bash-tool-input/bash-tool-input-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { agyPreToolHookDataContract } from '../../../contracts/agy-pre-tool-hook-data/agy-pre-tool-hook-data-contract';
import {
  agyPreToolDecisionContract,
  type AgyPreToolDecision,
} from '../../../contracts/agy-pre-tool-decision/agy-pre-tool-decision-contract';

export const HookAgyPreToolResponder = async ({
  hookInput,
}: {
  hookInput: unknown;
}): Promise<AgyPreToolDecision> => {
  const parseResult = agyPreToolHookDataContract.safeParse(hookInput);
  if (!parseResult.success) {
    return agyPreToolDecisionContract.parse({ decision: 'allow' });
  }

  const { toolCall, workspacePaths } = parseResult.data;
  if (!toolCall || typeof toolCall.name !== 'string') {
    return agyPreToolDecisionContract.parse({ decision: 'allow' });
  }

  const { name, args } = toolCall;

  if (name === 'run_command') {
    const rawCommandLine = args?.CommandLine;
    const command = typeof rawCommandLine === 'string' ? rawCommandLine : '';

    if (isBlockedGitDestructiveCommandGuard({ command })) {
      return agyPreToolDecisionContract.parse({
        decision: 'deny',
        reason: gitDestructiveBlockStatics.blockMessage,
      });
    }

    if (isWardPipedCommandGuard({ command })) {
      const strippedCommand = stripWardPipeCommandTransformer({ command });
      return agyPreToolDecisionContract.parse({
        decision: 'allow',
        overwrite: {
          CommandLine: strippedCommand,
        },
      });
    }

    if (isBlockedQualityCommandGuard({ command })) {
      const parsedCommand = bashToolInputContract.shape.command.safeParse(command);
      const brandedCommand = parsedCommand.success
        ? parsedCommand.data
        : bashToolInputContract.shape.command.parse('unknown');
      return agyPreToolDecisionContract.parse({
        decision: 'deny',
        reason: wardSuggestionMessageTransformer({ command: brandedCommand }),
      });
    }

    if (isBlockedSearchCommandGuard({ command })) {
      return agyPreToolDecisionContract.parse({
        decision: 'deny',
        reason: discoverSuggestionMessageStatics.blockMessage,
      });
    }

    return agyPreToolDecisionContract.parse({ decision: 'allow' });
  }

  if (name === 'write_to_file') {
    const rawTargetFile = args?.TargetFile;
    const rawCodeContent = args?.CodeContent;
    const filePath = typeof rawTargetFile === 'string' ? rawTargetFile : '';
    const content = typeof rawCodeContent === 'string' ? rawCodeContent : '';

    if (filePath.length === 0) {
      return agyPreToolDecisionContract.parse({ decision: 'allow' });
    }

    const toolInput = writeToolInputContract.parse({
      file_path: filePath,
      content,
    });

    const firstWorkspace = workspacePaths?.[0];
    const cwd = firstWorkspace ? filePathContract.parse(firstWorkspace) : undefined;

    const result = await violationsCheckNewBroker({
      toolInput,
      ...(cwd === undefined ? {} : { cwd }),
    });

    if (result.hasNewViolations) {
      return agyPreToolDecisionContract.parse({
        decision: 'deny',
        reason: result.message ?? violationMessageStatics.header,
      });
    }

    return agyPreToolDecisionContract.parse({ decision: 'allow' });
  }

  if (name === 'replace_file_content') {
    const rawTargetFile = args?.TargetFile;
    const rawTargetContent = args?.TargetContent;
    const rawReplacementContent = args?.ReplacementContent;
    const filePath = typeof rawTargetFile === 'string' ? rawTargetFile : '';
    const oldString = typeof rawTargetContent === 'string' ? rawTargetContent : '';
    const newString = typeof rawReplacementContent === 'string' ? rawReplacementContent : '';

    if (filePath.length === 0) {
      return agyPreToolDecisionContract.parse({ decision: 'allow' });
    }

    const toolInput = editToolInputContract.parse({
      file_path: filePath,
      old_string: oldString,
      new_string: newString,
    });

    const firstWorkspace = workspacePaths?.[0];
    const cwd = firstWorkspace ? filePathContract.parse(firstWorkspace) : undefined;

    const result = await violationsCheckNewBroker({
      toolInput,
      ...(cwd === undefined ? {} : { cwd }),
    });

    if (result.hasNewViolations) {
      return agyPreToolDecisionContract.parse({
        decision: 'deny',
        reason: result.message ?? violationMessageStatics.header,
      });
    }

    return agyPreToolDecisionContract.parse({ decision: 'allow' });
  }

  if (name === 'grep_search' || name === 'find_by_name') {
    return agyPreToolDecisionContract.parse({
      decision: 'deny',
      reason: discoverSuggestionMessageStatics.blockMessage,
    });
  }

  return agyPreToolDecisionContract.parse({ decision: 'allow' });
};
