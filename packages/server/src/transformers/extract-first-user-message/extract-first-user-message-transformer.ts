/**
 * PURPOSE: Extracts the first meaningful user message from JSONL file contents to use as a session display name
 *
 * USAGE:
 * extractFirstUserMessageTransformer({ fileContent: fileContentsContract.parse('{"type":"user","message":{"role":"user","content":"Help me build a login page"}}') });
 * // Returns SessionSummary 'Help me build a login page' or undefined if no valid user message found
 */

import type { FileContents } from '../../contracts/file-contents/file-contents-contract';
import {
  sessionSummaryContract,
  type SessionSummary,
} from '../../contracts/session-summary/session-summary-contract';
import { userMessageCommandPrefixesStatics } from '../../statics/user-message-command-prefixes/user-message-command-prefixes-statics';

const MAX_DISPLAY_LENGTH = 80;

export const extractFirstUserMessageTransformer = ({
  fileContent,
}: {
  fileContent: FileContents;
}): SessionSummary | undefined => {
  if (!fileContent) {
    return undefined;
  }

  const lines = fileContent.trimEnd().split('\n');

  for (const line of lines) {
    if (!line) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(line);

      if (typeof parsed !== 'object' || parsed === null) {
        continue;
      }

      const lineType: unknown = Reflect.get(parsed, 'type');

      if (lineType !== 'user') {
        continue;
      }

      const isMeta: unknown = Reflect.get(parsed, 'isMeta');

      if (isMeta === true) {
        continue;
      }

      const message: unknown = Reflect.get(parsed, 'message');

      if (typeof message !== 'object' || message === null) {
        continue;
      }

      const content: unknown = Reflect.get(message, 'content');

      if (typeof content !== 'string') {
        continue;
      }

      const startsWithCommand = userMessageCommandPrefixesStatics.prefixes.some((prefix) =>
        content.startsWith(prefix),
      );

      if (startsWithCommand) {
        continue;
      }

      const truncated =
        content.length > MAX_DISPLAY_LENGTH
          ? `${content.substring(0, MAX_DISPLAY_LENGTH)}...`
          : content;

      return sessionSummaryContract.parse(truncated);
    } catch {
      // skip unparseable lines
    }
  }

  // Second pass: extract command name as fallback
  for (const line of lines) {
    if (!line) {
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(line);

      if (typeof parsed !== 'object' || parsed === null) {
        continue;
      }

      const lineType: unknown = Reflect.get(parsed, 'type');

      if (lineType !== 'user') {
        continue;
      }

      const isMeta: unknown = Reflect.get(parsed, 'isMeta');

      if (isMeta === true) {
        continue;
      }

      const message: unknown = Reflect.get(parsed, 'message');

      if (typeof message !== 'object' || message === null) {
        continue;
      }

      const content: unknown = Reflect.get(message, 'content');

      if (typeof content !== 'string') {
        continue;
      }

      const commandNameMatch = /<command-name>(.*?)<\/command-name>/u.exec(content);

      if (!commandNameMatch?.[1]) {
        continue;
      }

      const [, commandName] = commandNameMatch;
      const argsMatch = /<command-args>(.*?)<\/command-args>/u.exec(content);
      const args = argsMatch?.[1];

      const summary = args ? `${commandName} ${args}` : commandName;
      const truncated =
        summary.length > MAX_DISPLAY_LENGTH
          ? `${summary.substring(0, MAX_DISPLAY_LENGTH)}...`
          : summary;

      return sessionSummaryContract.parse(truncated);
    } catch {
      // skip unparseable lines
    }
  }

  return undefined;
};
