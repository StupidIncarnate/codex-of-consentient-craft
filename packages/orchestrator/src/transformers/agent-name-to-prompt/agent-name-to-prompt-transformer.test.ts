import { AgentPromptNameStub } from '../../contracts/agent-prompt-name/agent-prompt-name.stub';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerQuestReviewMinionStatics } from '../../statics/pathseeker-quest-review-minion/pathseeker-quest-review-minion-statics';
import { pathseekerSurfaceScopeMinionStatics } from '../../statics/pathseeker-surface-scope-minion/pathseeker-surface-scope-minion-statics';
import { agentNameToPromptTransformer } from './agent-name-to-prompt-transformer';

describe('agentNameToPromptTransformer', () => {
  it('VALID: {agent: "chaoswhisperer-gap-minion"} => returns chaoswhisperer gap minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'chaoswhisperer-gap-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'chaoswhisperer-gap-minion',
      model: 'sonnet',
      prompt: chaoswhispererGapMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-quest-review-minion"} => returns pathseeker quest review minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-quest-review-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-quest-review-minion',
      model: 'sonnet',
      prompt: pathseekerQuestReviewMinionStatics.prompt.template,
    });
  });

  it('VALID: {agent: "pathseeker-surface-scope-minion"} => returns pathseeker surface scope minion prompt data', () => {
    const agent = AgentPromptNameStub({ value: 'pathseeker-surface-scope-minion' });

    const result = agentNameToPromptTransformer({ agent });

    expect(result).toStrictEqual({
      name: 'pathseeker-surface-scope-minion',
      model: 'sonnet',
      prompt: pathseekerSurfaceScopeMinionStatics.prompt.template,
    });
  });
});
