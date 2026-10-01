/**
 * PURPOSE: The prompt the spawn layer resumes a session with after it ENDED ITS TURN CLEANLY without
 * calling `signal-back`. Reach for this over agentTaskPromptTransformer's `resume` variant, which
 * tells the session it was KILLED mid-action: a session that exited 0 was not cut off, and telling it
 * so sends it re-checking work it never lost instead of answering why it stopped.
 *
 * USAGE:
 * agentUnsignalledExitPromptTransformer({ agent: 'spiritmender', workItemId, questId });
 * // Returns the "you ended without signalling" prompt text
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { agentSessionWallStatics } from '../../statics/agent-session-wall/agent-session-wall-statics';

export const agentUnsignalledExitPromptTransformer = ({
  agent,
  workItemId,
  questId,
}: {
  agent: string;
  workItemId: WorkItem['id'];
  questId: Quest['id'];
}): string =>
  `Your last turn ENDED without calling mcp__dungeonmaster__signal-back, so the orchestrator still reads this work item as unfinished. You were not cut off — your context above is complete and accurate.\n\nDo exactly one of these, now:\n\n1. If you finished or can finish the work: record it through mcp__dungeonmaster__quest-work, then signal, in that order:\nmcp__dungeonmaster__quest-work({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\nmcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\nIf you never fetched your instructions, fetch them first: mcp__dungeonmaster__get-agent-prompt({ agent: "${agent}", workItemId: "${workItemId}", questId: "${questId}" }).\n\n2. If something outside your control stops you and quest-work is reachable, record the outcome word "wall" with the reason, then signal.\n\n3. If the mcp__dungeonmaster__ tools are missing or quest-work is unreachable, end your turn with a final line that reads exactly:\n${agentSessionWallStatics.marker.text} <what stopped you, and the error you saw>\n\nThis is the only reminder. Ending this turn without either a signal or that line halts the quest for a human.`;
