/**
 * PURPOSE: Replays a Claude session's JSONL history by reading main + subagent files, processing each line, and emitting enriched entries and patches via callbacks
 *
 * USAGE:
 * await chatHistoryReplayBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   guildId: GuildIdStub({ value: 'f47ac10b-...' }),
 *   onEntry: ({ entry }) => { },
 *   onPatch: ({ toolUseId, agentId }) => { },
 * });
 * // Emits entries and patches through callbacks (no return value)
 */

import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

import type { ArrayIndex } from '@dungeonmaster/shared/contracts';
import { arrayIndexContract } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapter } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { agentIdContract } from '../../../contracts/agent-id/agent-id-contract';
import type {
  ChatLineEntry,
  ChatLinePatch,
} from '../../../contracts/chat-line-output/chat-line-output-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { ChatLineSource } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { extractTimestampFromJsonlLineTransformer } from '../../../transformers/extract-timestamp-from-jsonl-line/extract-timestamp-from-jsonl-line-transformer';
import { guildGetBroker } from '../../guild/get/guild-get-broker';

export const chatHistoryReplayBroker = async ({
  sessionId,
  guildId,
  onEntry,
  onPatch,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  onEntry: (params: { entry: ChatLineEntry['entry'] }) => void;
  onPatch: (params: {
    toolUseId: ChatLinePatch['toolUseId'];
    agentId: ChatLinePatch['agentId'];
  }) => void;
}): Promise<void> => {
  const guild = await guildGetBroker({ guildId });
  const projectPath = absoluteFilePathContract.parse(guild.path);
  const homeDir = osUserHomedirAdapter();

  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath,
    sessionId,
  });

  const sessionLines = await fsReadJsonlAdapter({ filePath: jsonlPath });

  const subagentsDir = `${stripJsonlSuffixTransformer({ filePath: jsonlPath })}/subagents`;

  const subagentFiles: {
    agentId: ReturnType<typeof agentIdContract.parse>;
    lines: StreamJsonLine[];
  }[] = [];

  try {
    const files = fsReaddirAdapter({ dirPath: subagentsDir });
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

    const results = await Promise.all(
      jsonlFiles.map(async (file) => ({
        agentId: agentIdContract.parse(file.replace('.jsonl', '')),
        lines: await fsReadJsonlAdapter({
          filePath: absoluteFilePathContract.parse(`${subagentsDir}/${file}`),
        }),
      })),
    );
    subagentFiles.push(...results);
  } catch {
    // subagents directory may not exist
  }

  const processor = chatLineProcessTransformer();
  const sessionSource = chatLineSourceContract.parse('session');
  const subagentSource = chatLineSourceContract.parse('subagent');

  const taggedLines: {
    line: StreamJsonLine;
    source: ChatLineSource;
    agentId?: ReturnType<typeof agentIdContract.parse>;
    timestamp: IsoTimestamp;
    index: ArrayIndex;
  }[] = [];

  let globalIndex = 0;

  for (const line of sessionLines) {
    const timestamp = extractTimestampFromJsonlLineTransformer({ line });
    taggedLines.push({
      line,
      source: sessionSource,
      timestamp,
      index: arrayIndexContract.parse(globalIndex),
    });
    globalIndex += 1;
  }

  for (const subagentFile of subagentFiles) {
    for (const line of subagentFile.lines) {
      const timestamp = extractTimestampFromJsonlLineTransformer({ line });
      taggedLines.push({
        line,
        source: subagentSource,
        agentId: subagentFile.agentId,
        timestamp,
        index: arrayIndexContract.parse(globalIndex),
      });
      globalIndex += 1;
    }
  }

  taggedLines.sort((a, b) => {
    const timeCompare = a.timestamp.localeCompare(b.timestamp);
    if (timeCompare !== 0) return timeCompare;

    return a.index - b.index;
  });

  for (const tagged of taggedLines) {
    const outputs = processor.processLine({
      line: tagged.line,
      source: tagged.source,
      ...(tagged.agentId === undefined ? {} : { agentId: tagged.agentId }),
    });
    for (const output of outputs) {
      if (output.type === 'entry') {
        onEntry({ entry: output.entry });
      }
      if (output.type === 'patch') {
        onPatch({ toolUseId: output.toolUseId, agentId: output.agentId });
      }
    }
  }
};
