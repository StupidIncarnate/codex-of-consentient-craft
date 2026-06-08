import { agentRoleContract } from './agent-role-contract';
import { AgentRoleStub } from './agent-role.stub';

describe('agentRoleContract', () => {
  describe('valid roles', () => {
    it('VALID: pathseeker => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pathseeker' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pathseeker');
    });

    it('VALID: pathseeker-surface => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pathseeker-surface' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pathseeker-surface');
    });

    it('VALID: pathseeker-dedup => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pathseeker-dedup' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pathseeker-dedup');
    });

    it('VALID: pathseeker-assertion-correctness => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pathseeker-assertion-correctness' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pathseeker-assertion-correctness');
    });

    it('VALID: pathseeker-walk => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pathseeker-walk' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pathseeker-walk');
    });

    it('VALID: codeweaver => parses successfully', () => {
      const role = AgentRoleStub({ value: 'codeweaver' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('codeweaver');
    });

    it('VALID: spiritmender => parses successfully', () => {
      const role = AgentRoleStub({ value: 'spiritmender' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('spiritmender');
    });

    it('VALID: lawbringer => parses successfully', () => {
      const role = AgentRoleStub({ value: 'lawbringer' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('lawbringer');
    });

    it('VALID: flowrider => parses successfully', () => {
      const role = AgentRoleStub({ value: 'flowrider' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('flowrider');
    });

    it('VALID: siegemaster => parses successfully', () => {
      const role = AgentRoleStub({ value: 'siegemaster' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('siegemaster');
    });

    it('VALID: blightwarden-security-minion => parses successfully', () => {
      const role = AgentRoleStub({ value: 'blightwarden-security-minion' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('blightwarden-security-minion');
    });

    it('VALID: blightwarden-dedup-minion => parses successfully', () => {
      const role = AgentRoleStub({ value: 'blightwarden-dedup-minion' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('blightwarden-dedup-minion');
    });

    it('VALID: blightwarden-perf-minion => parses successfully', () => {
      const role = AgentRoleStub({ value: 'blightwarden-perf-minion' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('blightwarden-perf-minion');
    });

    it('VALID: blightwarden-integrity-minion => parses successfully', () => {
      const role = AgentRoleStub({ value: 'blightwarden-integrity-minion' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('blightwarden-integrity-minion');
    });

    it('VALID: blightwarden-dead-code-minion => parses successfully', () => {
      const role = AgentRoleStub({ value: 'blightwarden-dead-code-minion' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('blightwarden-dead-code-minion');
    });

    it('VALID: blightwarden => parses successfully', () => {
      const role = AgentRoleStub({ value: 'blightwarden' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('blightwarden');
    });

    it('VALID: pesteater => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pesteater' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pesteater');
    });
  });

  describe('stub defaults', () => {
    it('VALID: {stub default} => creates agent role', () => {
      const result = AgentRoleStub();

      expect(result).toBe('pathseeker');
    });
  });

  describe('invalid roles', () => {
    it('INVALID: {unknown role} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse('unknown_role');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {number} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse(123 as never);
      }).toThrow(/Expected/u);
    });

    it('INVALID: {null} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse(null as never);
      }).toThrow(/Expected/u);
    });

    it('INVALID: {undefined} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse(undefined as never);
      }).toThrow(/Required/u);
    });

    it('INVALID: {object} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse({} as never);
      }).toThrow(/Expected/u);
    });
  });
});
