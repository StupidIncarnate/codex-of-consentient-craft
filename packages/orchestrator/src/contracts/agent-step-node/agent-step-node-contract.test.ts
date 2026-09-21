import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { agentStepNodeContract } from './agent-step-node-contract';
import { AgentStepNodeStub } from './agent-step-node.stub';

describe('agentStepNodeContract', () => {
  describe('valid input', () => {
    it('VALID: {role: worker, kind: prompt} => parses', () => {
      expect({
        role: agentStepNodeContract.parse(AgentStepNodeStub()).role,
        kind: agentStepNodeContract.parse(AgentStepNodeStub()).kind,
      }).toStrictEqual({ role: 'worker', kind: 'prompt' });
    });

    it('VALID: {a DETERMINISTIC step off agentFlowStatics} => reports its handler and its args', () => {
      const parsed = agentStepNodeContract.parse(agentFlowStatics.codeweaver.steps.ward);

      expect({
        kind: parsed.kind,
        handler: parsed.handler,
        args: parsed.args?.map(String),
      }).toStrictEqual({
        kind: 'deterministic',
        handler: 'ward',
        args: ['--committed', '--uncommitted'],
      });
    });

    it('VALID: {a PROMPT step off agentFlowStatics} => carries no handler at all', () => {
      expect(agentStepNodeContract.parse(agentFlowStatics.codeweaver.steps.work).handler).toBe(
        undefined,
      );
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

    it('INVALID: {a handler name naming no code} => throws, because the handler set is closed', () => {
      expect(() => AgentStepNodeStub({ handler: 'spiritmender' as never })).toThrow(/handler/u);
    });
  });
});
