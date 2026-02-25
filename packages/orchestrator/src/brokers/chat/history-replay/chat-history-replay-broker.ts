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

import { fsReadJsonlAdapter } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { agentIdContract } from '../../../contracts/agent-id/agent-id-contract';
import type {
  ChatLineEntry,
  ChatLinePatch,
} from '../../../contracts/chat-line-output/chat-line-output-contract';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
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

  for (const line of sessionLines) {
    const outputs = processor.processLine({ line, source: sessionSource });
    for (const output of outputs) {
      if (output.type === 'entry') {
        onEntry({ entry: output.entry });
      }
      if (output.type === 'patch') {
        onPatch({ toolUseId: output.toolUseId, agentId: output.agentId });
      }
    }
  }

  for (const subagentFile of subagentFiles) {
    for (const line of subagentFile.lines) {
      const outputs = processor.processLine({
        line,
        source: subagentSource,
        agentId: subagentFile.agentId,
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
  }
};
