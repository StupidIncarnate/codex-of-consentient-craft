import { agentRoleContract } from './agent-role-contract';
import { AgentRoleStub } from './agent-role.stub';

type AgentRole = ReturnType<typeof AgentRoleStub>;

describe('agentRoleContract', () => {
  it('VALID: pathseeker role => parses successfully', () => {
    const result: AgentRole = AgentRoleStub({ value: 'pathseeker' });

    expect(agentRoleContract.parse(result)).toBe('pathseeker');
  });
});
