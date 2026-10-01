import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { agentUnsignalledExitPromptTransformer } from './agent-unsignalled-exit-prompt-transformer';

describe('agentUnsignalledExitPromptTransformer', () => {
  it('VALID: {agent: spiritmender, workItemId, questId} => says the turn ended unsignalled, not killed, and names all three exits', () => {
    const workItemId = QuestWorkItemIdStub({ value: 'eeeeeeee-1111-4222-9333-444444444444' });
    const questId = QuestIdStub({ value: 'quest-unsignalled' });

    const result = agentUnsignalledExitPromptTransformer({
      agent: 'spiritmender',
      workItemId,
      questId,
    });

    expect(result).toBe(
      `Your last turn ENDED without calling mcp__dungeonmaster__signal-back, so the orchestrator still reads this work item as unfinished. You were not cut off — your context above is complete and accurate.\n\nDo exactly one of these, now:\n\n1. If you finished or can finish the work: record it through mcp__dungeonmaster__quest-work, then signal, in that order:\nmcp__dungeonmaster__quest-work({\n  questId: "quest-unsignalled",\n  workItemId: "eeeeeeee-1111-4222-9333-444444444444",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\nmcp__dungeonmaster__signal-back({\n  questId: "quest-unsignalled",\n  workItemId: "eeeeeeee-1111-4222-9333-444444444444",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})\nIf you never fetched your instructions, fetch them first: mcp__dungeonmaster__get-agent-prompt({ agent: "spiritmender", workItemId: "eeeeeeee-1111-4222-9333-444444444444", questId: "quest-unsignalled" }).\n\n2. If something outside your control stops you and quest-work is reachable, record the outcome word "wall" with the reason, then signal.\n\n3. If the mcp__dungeonmaster__ tools are missing or quest-work is unreachable, end your turn with a final line that reads exactly:\nDUNGEONMASTER-WALL: <what stopped you, and the error you saw>\n\nThis is the only reminder. Ending this turn without either a signal or that line halts the quest for a human.`,
    );
  });
});
