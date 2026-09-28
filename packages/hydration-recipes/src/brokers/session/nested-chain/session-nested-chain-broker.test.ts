import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  TaskToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { sessionNestedChainBroker } from './session-nested-chain-broker';
import { sessionNestedChainBrokerProxy } from './session-nested-chain-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';

type StreamJsonLine = ReturnType<typeof streamLineToJsonLineTransformer>;

const taskToolUseLine = ({
  toolUseId,
  level,
}: {
  toolUseId: string;
  level: number;
}): StreamJsonLine =>
  streamLineToJsonLineTransformer({
    streamLine: AssistantTaskToolUseStreamLineStub({
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: toolUseId,
            name: 'Agent',
            input: {
              description: `Nested task ${level}`,
              prompt: `Nested prompt ${level}`,
              subagent_type: 'general-purpose',
            },
          },
        ],
      },
    }),
  });

const taskToolResultLine = ({
  toolUseId,
  agentId,
}: {
  toolUseId: string;
  agentId: string;
}): StreamJsonLine =>
  streamLineToJsonLineTransformer({
    streamLine: TaskToolResultStreamLineStub({
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
      },
      toolUseResult: { agentId },
    }),
  });

const assistantTextLine = ({ level }: { level: number }): StreamJsonLine =>
  streamLineToJsonLineTransformer({
    streamLine: AssistantTextStreamLineStub({
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: `Nested agent ${level} response` }],
      },
    }),
  });

describe('sessionNestedChainBroker', () => {
  describe('depth: 2', () => {
    it('VALID: {args: {depth: 2}} => the session gets its own Task/tool_result pair, and the outer agent gets its own nested pair', async () => {
      const proxy = sessionNestedChainBrokerProxy();
      const target = DmTargetStub({ claudeHome: '/tmp/guild-1' });
      const sessionsDir = '/tmp/guild-1/.claude/projects/-tmp-guild-1';
      const sessionFilePath = `${sessionsDir}/seed-session-1.jsonl`;
      const outerAgentFilePath = `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1.jsonl`;
      const nestedAgentFilePath = `${sessionsDir}/seed-session-1/subagents/agent-seed-agent-1-1.jsonl`;
      proxy.succeeds({
        filePaths: [sessionFilePath, outerAgentFilePath, nestedAgentFilePath],
      });

      const result = await sessionNestedChainBroker({
        target,
        record: { sessionId: 'seed-session-1', cwd: '/tmp/guild-1' },
        args: { depth: 2 },
      });

      expect(result).toStrictEqual({ success: true });
      expect({
        session: proxy.getAllAppendedLines({ filePath: sessionFilePath }),
        outerAgent: proxy.getAllAppendedLines({ filePath: outerAgentFilePath }),
        nestedAgent: proxy.getAllAppendedLines({ filePath: nestedAgentFilePath }),
      }).toStrictEqual({
        session: [
          taskToolUseLine({ toolUseId: 'toolu_seed_nested_1', level: 1 }),
          taskToolResultLine({ toolUseId: 'toolu_seed_nested_1', agentId: 'seed-agent-1' }),
        ],
        outerAgent: [
          assistantTextLine({ level: 1 }),
          taskToolUseLine({ toolUseId: 'toolu_seed_nested_2', level: 2 }),
          taskToolResultLine({ toolUseId: 'toolu_seed_nested_2', agentId: 'seed-agent-1-1' }),
        ],
        nestedAgent: [assistantTextLine({ level: 2 })],
      });
    });
  });
});
