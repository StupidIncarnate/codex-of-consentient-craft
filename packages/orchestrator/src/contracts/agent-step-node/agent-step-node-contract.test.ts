import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { agentStepNodeContract } from './agent-step-node-contract';
import { AgentStepNodeStub } from './agent-step-node.stub';

describe('agentStepNodeContract', () => {
  describe('valid input', () => {
    it('VALID: {role: worker} => parses', () => {
      expect(agentStepNodeContract.parse(AgentStepNodeStub()).role).toBe('worker');
    });

    it('VALID: {a real step node off agentFlowStatics} => parses and keeps its other keys', () => {
      const parsed = agentStepNodeContract.parse(agentFlowStatics.codeweaver.steps.plan);

      expect({ role: parsed.role, kind: parsed.kind, prompt: parsed.prompt }).toStrictEqual({
        role: 'planner',
        kind: 'prompt',
        prompt: 'codeweaver-planner',
      });
    });

    it('VALID: {a reviewer step off agentFlowStatics} => reports reviewer', () => {
      expect(agentStepNodeContract.parse(agentFlowStatics.codeweaver.steps.review).role).toBe(
        'reviewer',
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {role: antagonist} => throws, because the split has exactly three sides', () => {
      expect(() => AgentStepNodeStub({ role: 'antagonist' as never })).toThrow(/role/u);
    });

    it('EMPTY: {no role} => throws', () => {
      expect(() => agentStepNodeContract.parse({})).toThrow(/role/u);
    });
  });
});
