import { StreamJsonLineStub, TaskToolResultStreamLineStub } from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { SubagentFileStub } from '../../../contracts/subagent-file/subagent-file.stub';

import { scopeSubagentFilesToDescendantsLayerBroker } from './scope-subagent-files-to-descendants-layer-broker';
import { scopeSubagentFilesToDescendantsLayerBrokerProxy } from './scope-subagent-files-to-descendants-layer-broker.proxy';

const completionLineForChild = ({
  childRealAgentId,
  toolUseId,
}: {
  childRealAgentId: string;
  toolUseId: string;
}): ReturnType<typeof StreamJsonLineStub> =>
  StreamJsonLineStub({
    value: JSON.stringify(
      TaskToolResultStreamLineStub({
        message: {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
        },
        toolUseResult: { agentId: childRealAgentId },
      }),
    ),
  });

const plainAssistantLine = StreamJsonLineStub({
  value: '{"type":"assistant","message":{"content":[]}}',
});

describe('scopeSubagentFilesToDescendantsLayerBroker', () => {
  describe('descendant scoping', () => {
    it('VALID: {root file spawns B via its tool_result agentId} => keeps root and B, drops unrelated sibling', () => {
      scopeSubagentFilesToDescendantsLayerBrokerProxy();
      const rootAgentId = AgentIdStub({ value: 'real-root' });

      const rootFile = SubagentFileStub({
        agentId: rootAgentId,
        lines: [completionLineForChild({ childRealAgentId: 'real-b', toolUseId: 'toolu_b' })],
      });
      const bFile = SubagentFileStub({
        agentId: AgentIdStub({ value: 'real-b' }),
        lines: [plainAssistantLine],
      });
      const siblingFile = SubagentFileStub({
        agentId: AgentIdStub({ value: 'real-sibling' }),
        lines: [plainAssistantLine],
      });

      const result = scopeSubagentFilesToDescendantsLayerBroker({
        files: [rootFile, bFile, siblingFile],
        rootAgentId,
      });

      expect(result).toStrictEqual([rootFile, bFile]);
    });

    it('VALID: {depth-2 chain root -> B -> G} => keeps all three transitively', () => {
      scopeSubagentFilesToDescendantsLayerBrokerProxy();
      const rootAgentId = AgentIdStub({ value: 'real-root' });

      const rootFile = SubagentFileStub({
        agentId: rootAgentId,
        lines: [completionLineForChild({ childRealAgentId: 'real-b', toolUseId: 'toolu_b' })],
      });
      const bFile = SubagentFileStub({
        agentId: AgentIdStub({ value: 'real-b' }),
        lines: [completionLineForChild({ childRealAgentId: 'real-g', toolUseId: 'toolu_g' })],
      });
      const gFile = SubagentFileStub({
        agentId: AgentIdStub({ value: 'real-g' }),
        lines: [plainAssistantLine],
      });

      const result = scopeSubagentFilesToDescendantsLayerBroker({
        files: [rootFile, bFile, gFile],
        rootAgentId,
      });

      expect(result).toStrictEqual([rootFile, bFile, gFile]);
    });

    it('EMPTY: {root file spawns nothing} => keeps only the root file', () => {
      scopeSubagentFilesToDescendantsLayerBrokerProxy();
      const rootAgentId = AgentIdStub({ value: 'real-root' });

      const rootFile = SubagentFileStub({ agentId: rootAgentId, lines: [plainAssistantLine] });
      const otherFile = SubagentFileStub({
        agentId: AgentIdStub({ value: 'real-other' }),
        lines: [plainAssistantLine],
      });

      const result = scopeSubagentFilesToDescendantsLayerBroker({
        files: [rootFile, otherFile],
        rootAgentId,
      });

      expect(result).toStrictEqual([rootFile]);
    });
  });
});
