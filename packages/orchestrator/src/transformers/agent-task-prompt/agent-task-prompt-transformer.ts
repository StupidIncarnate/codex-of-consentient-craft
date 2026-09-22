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
 *   BOTH variants name `quest-work` BEFORE `signal-back`, and that order is the wire. `signal-back`
 *   is a session-terminal marker and carries no outcome: its input contracts are `.strict()` and
 *   hold questId, workItemId, signal, operationItemId and blockedReason and nothing else. The marks
 *   ride on `quest-work`'s `observations` payload and the outcome word on its `outcome` payload, and
 *   the unmarked-unit gate refuses a signal from a session that skipped the first of the two.
 *
 * USAGE:
 * const taskPrompt = agentTaskPromptTransformer({ role, workItemId, questId });
 * // Returns: PromptText — the get-agent-prompt + quest-work + signal-back call template
 * const resumePrompt = agentTaskPromptTransformer({ role, workItemId, questId, resume: true });
 * // Returns: PromptText — the finish-what-you-started variant
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import {
  promptTextContract,
  type PromptText,
} from '../../contracts/prompt-text/prompt-text-contract';

export const agentTaskPromptTransformer = ({
  agent,
  role,
  workItemId,
  questId,
  resume,
}: {
  agent?: string;
  role?: string;
  workItemId: QuestWorkItemId;
  questId: QuestId;
  resume?: boolean;
}): PromptText => {
  const targetAgent = agentPromptNameContract.parse(agent ?? role);

  if (resume === true) {
    return promptTextContract.parse(
      `You were CUT OFF mid-work on this item — your session was killed, not paused cleanly. The context above therefore stops abruptly and your LAST ACTION MAY NEVER HAVE COMPLETED: an edit may not have been written, a command may have died mid-run, a commit may not exist. Do not treat your own context as a record of what landed.\n\nRE-ESTABLISH THE CURRENT STATE FIRST, before doing any new work:\n1. Run \`git status\` and \`git log --oneline -5\` — what is actually committed, and what is still uncommitted?\n2. Re-read the files you believe you edited, and confirm the change is really on disk.\n3. Re-run whatever you were in the middle of verifying (a test, a ward run, a browser step) instead of trusting the remembered result.\n\nOnly once you know the real state: finish the remaining scope of your operation item and commit a prose handoff. Then RECORD what you did through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\n\nIf you have no usable context above, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${targetAgent}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions from the top.`,
    );
  }

  return promptTextContract.parse(
    `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${targetAgent}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
  );
};
