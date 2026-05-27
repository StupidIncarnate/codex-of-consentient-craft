/**
 * PURPOSE: Handles interaction MCP tool calls (signal-back, get-agent-prompt)
 *
 * USAGE:
 * const result = await InteractionHandleResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 * // Returns ToolResponse with interaction result
 */

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import { signalBackBroker } from '../../../brokers/signal/back/signal-back-broker';
import { orchestratorGetAgentPromptAdapter } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter';
import { orchestratorHandleSignalBackAdapter } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter';
import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { getAgentPromptInputContract } from '../../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import { ResolveSubagentIdentityLayerResponder } from './resolve-subagent-identity-layer-responder';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

const JSON_INDENT_SPACES = 2;

export const InteractionHandleResponder = async ({
  tool,
  args,
  meta,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
  meta?: Record<string, unknown>;
}): Promise<ToolResponse> => {
  if (tool === 'signal-back') {
    const result = signalBackBroker({
      input: args,
    });

    if (result.success) {
      // After validating the signal, run any orchestrator-side post-processing
      // tied to the work item that just signalled. Currently that means firing
      // questPostWalkHookBroker when a pathseeker-walk work item completes —
      // the responder's no-op fast path covers every other role + signal pair.
      await orchestratorHandleSignalBackAdapter({
        questId: result.signal.questId,
        workItemId: result.signal.workItemId,
        signal: result.signal.signal,
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  }

  if (tool === 'get-agent-prompt') {
    const parsed = getAgentPromptInputContract.safeParse(args);
    if (!parsed.success) {
      throw new Error(
        `get-agent-prompt requires {agent, questId, workItemId}: ${parsed.error.message}`,
      );
    }

    // Stamp the calling sub-agent's identity AND flip status to in_progress. The MCP call
    // itself is direct proof the sub-agent is alive — file presence alone cannot prove
    // liveness because Claude CLI never deletes subagent JSONLs. `sessionId` is the parent
    // /dumpster-launch session UUID and `agentId` is the realAgentId Claude CLI assigned
    // to this Task. The layer responder prefers `_meta.claudecode/toolUseId` (deterministic)
    // and falls back to mtime+workItemId scan for older Claude Code clients. Best-effort:
    // any resolution failure is logged and skipped so the prompt response still flows.
    try {
      const identity = await ResolveSubagentIdentityLayerResponder({
        ...(meta !== undefined && { meta }),
        workItemId: parsed.data.workItemId,
      });
      if (identity !== undefined) {
        await orchestratorModifyQuestAdapter({
          questId: String(parsed.data.questId),
          input: {
            questId: parsed.data.questId,
            workItems: [
              {
                id: parsed.data.workItemId,
                sessionId: identity.sessionId,
                agentId: identity.agentId,
                status: 'in_progress',
                startedAt: new Date().toISOString(),
              },
            ],
          } as ModifyQuestInput,
        });
      }
    } catch (error: unknown) {
      process.stderr.write(
        `[get-agent-prompt] session-id stamp failed: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }

    const result = await orchestratorGetAgentPromptAdapter({
      agent: parsed.data.agent,
      questId: parsed.data.questId,
      workItemId: parsed.data.workItemId,
    });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  }

  throw new Error(`Unknown interaction tool: ${String(tool)}`);
};
