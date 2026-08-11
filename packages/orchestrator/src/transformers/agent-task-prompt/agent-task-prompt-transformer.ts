/**
 * PURPOSE: Builds the verbatim prompt string the orchestrator dispatches to one agent session,
 *   interpolating role + questId + workItemId. The `resume` variant is what Node dispatch sends
 *   when it resumes a retained session (`claude --resume`) — because orphan recovery reclaimed it,
 *   because the previous attempt died on an API overload, or because the user resumed a blocked
 *   quest.
 *
 *   The resume variant leads with the fact that the session was KILLED, not paused: its context
 *   ends mid-action, so the agent's last edit/command/commit may never have landed. An agent that
 *   trusts its own context as a record of what happened re-reports work it never finished, or
 *   redoes work it already committed. The prompt therefore requires re-establishing real state
 *   (git status, re-read the files, re-run the check) BEFORE any new work.
 *
 * USAGE:
 * const taskPrompt = agentTaskPromptTransformer({ role, workItemId, questId });
 * // Returns: PromptText — the get-agent-prompt + signal-back call template
 * const resumePrompt = agentTaskPromptTransformer({ role, workItemId, questId, resume: true });
 * // Returns: PromptText — the finish-what-you-started variant
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import {
  promptTextContract,
  type PromptText,
} from '../../contracts/prompt-text/prompt-text-contract';

export const agentTaskPromptTransformer = ({
  role,
  workItemId,
  questId,
  resume,
}: {
  role: AgentRole;
  workItemId: QuestWorkItemId;
  questId: QuestId;
  resume?: boolean;
}): PromptText => {
  if (resume === true) {
    return promptTextContract.parse(
      `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${role}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
    );
  }

  return promptTextContract.parse(
    `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${role}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
  );
};
