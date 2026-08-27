/**
 * PURPOSE: Handles interaction MCP tool calls (signal-back, ask-user-question, get-agent-prompt, and
 * the three minion-family information tools)
 *
 * USAGE:
 * const result = await InteractionHandleResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 * // Returns ToolResponse with interaction result
 *
 * THE THREE INFORMATION TOOLS SHARE ONE BRANCH, through `INFORMATION_FAMILY_BY_TOOL`. Three separate
 * `if` blocks would each cost this function a point of cyclomatic complexity for a body that only
 * looks a static string up; one map plus one branch costs one. Their text is returned RAW, not
 * `JSON.stringify`d like the tool results either side of it: the caller reads the markdown rather than
 * parsing it, and escaping every newline in a document this long would push the reviewer payload
 * towards the 50KB cap the flow's integration test holds it under.
 */

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import { askUserQuestionBroker } from '../../../brokers/ask/user-question/ask-user-question-broker';
import { signalBackBroker } from '../../../brokers/signal/back/signal-back-broker';
import { orchestratorGetAgentPromptAdapter } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter';
import { orchestratorHandleSignalBackAdapter } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter';
import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { getAgentPromptInputContract } from '../../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import { ResolveSubagentIdentityLayerResponder } from './resolve-subagent-identity-layer-responder';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import { toolNameContract } from '../../../contracts/tool-name/tool-name-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { MinionFamily } from '../../../contracts/minion-family/minion-family-contract';
import { orchestratorMinionInformationAdapter } from '../../../adapters/orchestrator/minion-information/orchestrator-minion-information-adapter';

const JSON_INDENT_SPACES = 2;

const INFORMATION_FAMILY_BY_TOOL: Readonly<Partial<Record<ToolName, MinionFamily>>> = {
  [toolNameContract.parse('get-planner-information')]: 'planner',
  [toolNameContract.parse('get-worker-information')]: 'worker',
  [toolNameContract.parse('get-reviewer-information')]: 'reviewer',
};

export const InteractionHandleResponder = async ({
  tool,
  args,
  meta,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
  meta?: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const informationFamily = INFORMATION_FAMILY_BY_TOOL[tool];
  if (informationFamily !== undefined) {
    return {
      content: [
        { type: 'text', text: orchestratorMinionInformationAdapter({ family: informationFamily }) },
      ],
    };
  }

  if (tool === 'signal-back') {
    const result = signalBackBroker({
      input: args,
    });

    if (result.success) {
      // After validating the signal, apply it server-side: the handler marks the work item
      // terminal, applies the operation outcome (done -> complete; partial -> complete + a
      // "pt N" continuation; blocked -> the same continuation plus an immediate quest block) to
      // the ledger atomically, then advances the relay.
      await orchestratorHandleSignalBackAdapter({
        questId: result.signal.questId,
        workItemId: result.signal.workItemId,
        signal: result.signal.signal,
        ...(result.signal.operationItemId === undefined
          ? {}
          : { operationItemId: result.signal.operationItemId }),
        ...(result.signal.operationStatus === undefined
          ? {}
          : { operationStatus: result.signal.operationStatus }),
        ...(result.signal.blockedReason === undefined
          ? {}
          : { blockedReason: result.signal.blockedReason }),
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

  if (tool === 'ask-user-question') {
    // Fire-and-forget: validate the questions and instruct the agent to wait. The web surfaces the
    // questions to the browser clarify panel by scanning the session stream for this tool call; the
    // user's answers arrive as the agent's next user message when the session resumes.
    const result = askUserQuestionBroker({ input: args });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  if (tool === 'get-agent-prompt') {
    const parsed = getAgentPromptInputContract.safeParse(args);
    if (!parsed.success) {
      throw new Error(`get-agent-prompt requires {agent, questId}: ${parsed.error.message}`);
    }

    const { workItemId } = parsed.data;

    // Stamp the calling sub-agent's identity AND flip status to in_progress. ONLY when a
    // workItemId is present — a summoned minion fetches with { agent, questId } and has no work
    // item to stamp (it is observable as a sub-agent under its parent's chain via wire-level
    // toolUseId correlation, not via work-item identity). The MCP call itself is direct proof the
    // sub-agent is alive — file presence alone cannot prove liveness because Claude CLI never
    // deletes subagent JSONLs. `sessionId` is the parent /dumpster-launch session UUID and
    // `agentId` is the realAgentId Claude CLI assigned to this Task. The layer responder uses
    // `_meta.claudecode/toolUseId` paired with a cross-session JSONL scan for a matching
    // tool_use.id — deterministic, no mtime races. Best-effort: any resolution failure is logged
    // and skipped so the prompt response still flows.
    if (workItemId !== undefined) {
      try {
        const identity = await ResolveSubagentIdentityLayerResponder({
          ...(meta !== undefined && { meta }),
        });
        if (identity !== undefined) {
          await orchestratorModifyQuestAdapter({
            questId: String(parsed.data.questId),
            input: {
              questId: parsed.data.questId,
              workItems: [
                {
                  id: workItemId,
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
    }

    const result = await orchestratorGetAgentPromptAdapter({
      agent: parsed.data.agent,
      questId: parsed.data.questId,
      ...(workItemId !== undefined && { workItemId }),
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
