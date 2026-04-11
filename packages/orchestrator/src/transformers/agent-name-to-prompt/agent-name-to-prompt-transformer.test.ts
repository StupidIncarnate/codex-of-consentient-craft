import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { gapReviewerAgentPromptStatics } from '../../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';
import { finalizerQuestAgentPromptStatics } from '../../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';
import { plannerMinionQuestAgentPromptStatics } from '../../statics/planner-minion-quest-agent-prompt/planner-minion-quest-agent-prompt-statics';
import { agentNameToPromptTransformer } from './agent-name-to-prompt-transformer';

describe('agentNameToPromptTransformer', () => {
  it('VALID: {agent: "quest-gap-reviewer"} => returns gap reviewer prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'quest-gap-reviewer' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'quest-gap-reviewer',
      model: 'sonnet',
      prompt: gapReviewerAgentPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "finalizer-quest-agent"} => returns finalizer prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'finalizer-quest-agent' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'finalizer-quest-agent',
      model: 'sonnet',
      prompt: finalizerQuestAgentPromptStatics.prompt.template,
    });
  });

  it('VALID: {agent: "planner-minion-quest-agent"} => returns planner minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'planner-minion-quest-agent' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'planner-minion-quest-agent',
      model: 'sonnet',
      prompt: plannerMinionQuestAgentPromptStatics.prompt.template,
    });
  });
});
