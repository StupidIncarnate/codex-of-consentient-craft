/**
 * PURPOSE: Replays a Claude session's JSONL history by reading main + subagent files, processing each line, and emitting fully-parsed ChatEntry arrays via callbacks. Does a two-pass scan so the processor's realAgentId→toolUseId translation map is fully populated BEFORE any sub-agent JSONL line is processed — which is required because sub-agent file lines arrive in timestamp order BEFORE the main JSONL's completion tool_use_result that defines the translation.
 *
 * USAGE:
 * await chatHistoryReplayBroker({
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   guildId: GuildIdStub({ value: 'f47ac10b-...' }),
 *   onEntries: ({ entries }) => { },
 * });
 * // Emits entries through callbacks (no return value)
 *
 * TWO-SOURCE CONVERGENCE (file side):
 * Sub-agent JSONL files are keyed by real internal agentId (the filename), not by Task toolUseId.
 * The parent-stream `user` tool_result line is the only place both ids co-occur. We scan those
 * first to register every `realAgentId → toolUseId` translation with the processor, then iterate
 * all lines in timestamp order. When a sub-agent line arrives tagged with its real agentId, the
 * processor's normalizer translates it to the streaming wire shape (`parent_tool_use_id = toolUseId`)
 * so the ChatEntry it emits is indistinguishable from a streaming-sourced one.
 */

import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudeLineNormalizeBroker, cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  absoluteFilePathContract,
  adapterResultContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AdapterResult, ChatEntry, GuildId, SessionId } from '@dungeonmaster/shared/contracts';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

import type { ArrayIndex, StreamJsonLine } from '@dungeonmaster/shared/contracts';
import { arrayIndexContract } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapter } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { chatReplayJsonlReadBroker } from '../replay-jsonl-read/chat-replay-jsonl-read-broker';
import { agentIdContract } from '../../../contracts/agent-id/agent-id-contract';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import { chatLineSourceContract } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { ChatLineSource } from '../../../contracts/chat-line-source/chat-line-source-contract';
import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { normalizedStreamLineContentItemContract } from '../../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { extractTimestampFromJsonlLineTransformer } from '../../../transformers/extract-timestamp-from-jsonl-line/extract-timestamp-from-jsonl-line-transformer';
import { stripAgentFilenamePrefixTransformer } from '../../../transformers/strip-agent-filename-prefix/strip-agent-filename-prefix-transformer';
import { guildGetBroker } from '../../guild/get/guild-get-broker';

export const chatHistoryReplayBroker = async ({
  sessionId,
  guildId,
  onEntries,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  onEntries: (params: { entries: ChatEntry[] }) => void;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const guild = await guildGetBroker({ guildId });
  // Walk up from the guild path to the repo root (directory containing `.dungeonmaster.json`)
  // because Claude CLI encodes its session JSONL filename from the SPAWN cwd, not the guild
  // path. For the smoketests guild whose path is `<repo>/.dungeonmaster-dev`, the agent is
  // spawned at the repo root by `agent-spawn-by-role-broker`, so the JSONL lives under
  // `~/.claude/projects/-home-...-codex-of-consentient-craft/`, not `...--dungeonmaster-dev/`.
  // Falls back to the guild path when no `.dungeonmaster.json` ancestor exists (standalone
  // projects / e2e isolated /tmp dirs) — those agents spawn at the guild path itself.
  const guildStartPath = filePathContract.parse(guild.path);
  const resolvedProjectPath = await (async () => {
    try {
      const repoRootCwd = await cwdResolveBroker({
        startPath: guildStartPath,
        kind: 'repo-root',
      });
      return absoluteFilePathContract.parse(repoRootCwd);
    } catch {
      return absoluteFilePathContract.parse(guild.path);
    }
  })();
  const homeDir = osUserHomedirAdapter();

  const jsonlPath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath: resolvedProjectPath,
    sessionId,
  });

  // The JSONL may race a still-running chat: subscribe-quest can fire before the CLI
  // (real or fake) finishes its post-stdout JSONL flush. The replay broker polls briefly
  // for the file rather than ENOENT immediately — without this, live broadcasts shipped
  // before subscribe are lost AND replay misses the unwritten JSONL, so nothing reaches
  // the client.
  const sessionLines = await chatReplayJsonlReadBroker({ filePath: jsonlPath });

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
        agentId: stripAgentFilenamePrefixTransformer({ fileName: fileNameContract.parse(file) }),
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
    parsed: unknown;
    source: ChatLineSource;
    agentId?: ReturnType<typeof agentIdContract.parse>;
    timestamp: IsoTimestamp;
    index: ArrayIndex;
  }[] = [];

  let globalIndex = 0;

  for (const line of sessionLines) {
    const parsed = claudeLineNormalizeBroker({ rawLine: line });
    const timestamp = extractTimestampFromJsonlLineTransformer({ parsed });
    taggedLines.push({
      parsed,
      source: sessionSource,
      timestamp,
      index: arrayIndexContract.parse(globalIndex),
    });
    globalIndex += 1;
  }

  for (const subagentFile of subagentFiles) {
    for (const line of subagentFile.lines) {
      const parsed = claudeLineNormalizeBroker({ rawLine: line });
      const timestamp = extractTimestampFromJsonlLineTransformer({ parsed });
      taggedLines.push({
        parsed,
        source: subagentSource,
        agentId: subagentFile.agentId,
        timestamp,
        index: arrayIndexContract.parse(globalIndex),
      });
      globalIndex += 1;
    }
  }

  // PASS 1: scan every parent-stream user tool_result for `tool_use_result.agentId` paired
  // with the content item's `tool_use_id`. Register each mapping with the processor BEFORE
  // we emit any sub-agent lines. Without this pre-scan, sub-agent lines that sort earlier
  // than their completion tool_result can't translate their realAgentId to a Task toolUseId,
  // so the web's chain grouping would key on realAgentId for those lines and on toolUseId
  // for the eagerly-stamped Task entry — a permanent mismatch that looks like "(0 entries)".
  for (const line of sessionLines) {
    const parsed = claudeLineNormalizeBroker({ rawLine: line });
    const lineParse = normalizedStreamLineContract.safeParse(parsed);
    if (!lineParse.success) continue;
    const lineData = lineParse.data;
    if (lineData.type !== 'user') continue;
    const { toolUseResult } = lineData;
    if (toolUseResult === undefined) continue;
    if (typeof toolUseResult === 'string') continue;
    if (Array.isArray(toolUseResult)) continue;
    const realAgentIdRaw = toolUseResult.agentId;
    if (typeof realAgentIdRaw !== 'string' || realAgentIdRaw.length === 0) continue;
    const msg = lineData.message;
    if (msg === undefined) continue;
    const items = msg.content;
    if (!Array.isArray(items)) continue;
    for (const rawItem of items) {
      const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
      if (!itemParse.success) continue;
      const item = itemParse.data;
      if (item.type !== 'tool_result') continue;
      const tuid = item.toolUseId;
      if (typeof tuid !== 'string' || tuid.length === 0) continue;
      processor.registerAgentTranslation({
        agentId: agentIdContract.parse(realAgentIdRaw),
        toolUseId: toolUseIdContract.parse(tuid),
      });
    }
  }

  taggedLines.sort((a, b) => {
    const timeCompare = a.timestamp.localeCompare(b.timestamp);
    if (timeCompare !== 0) return timeCompare;

    return a.index - b.index;
  });

  // PASS 2: process every line in timestamp order. Sub-agent lines now flow through the
  // processor's normalizer with the translation map pre-populated, so they emerge with
  // `parent_tool_use_id` stamped and render identically to streaming-sourced lines.
  for (const tagged of taggedLines) {
    const outputs = processor.processLine({
      parsed: tagged.parsed,
      source: tagged.source,
      ...(tagged.agentId === undefined ? {} : { agentId: tagged.agentId }),
    });
    for (const output of outputs) {
      if (output.type === 'entries') {
        onEntries({ entries: output.entries });
      }
    }
  }
  return result;
};
